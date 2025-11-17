from __future__ import annotations

import asyncio
import json
import re
import subprocess
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy import Select, select

from ..core.config import get_settings
from ..core.database import session_scope
from ..core.models import Project, ProviderType, WorkflowDefinition
from ..providers.registry import get_provider
from .provider_manager import provider_manager
from .tool_service import tool_service


class WorkflowService:
    """CRUD and execution logic for WorkflowDefinition graphs."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def list_workflows(self, project_id: Optional[int] = None) -> List[WorkflowDefinition]:
        async with session_scope() as session:
            stmt: Select = select(WorkflowDefinition)
            if project_id is not None:
                stmt = stmt.where(WorkflowDefinition.project_id == project_id)
            stmt = stmt.order_by(WorkflowDefinition.created_at.desc())
            result = await session.scalars(stmt)
            return list(result)

    async def get_workflow(self, workflow_id: int) -> Optional[WorkflowDefinition]:
        async with session_scope() as session:
            return await session.get(WorkflowDefinition, workflow_id)

    async def create_workflow(
        self,
        project_id: int,
        name: str,
        description: Optional[str],
        graph: Dict[str, Any],
    ) -> WorkflowDefinition:
        async with session_scope() as session:
            workflow = WorkflowDefinition(
                project_id=project_id,
                name=name,
                description=description,
                graph=graph,
            )
            session.add(workflow)
            await session.flush()
            await session.refresh(workflow)
            return workflow

    async def update_workflow(
        self,
        workflow_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        graph: Optional[Dict[str, Any]] = None,
    ) -> Optional[WorkflowDefinition]:
        async with session_scope() as session:
            workflow = await session.get(WorkflowDefinition, workflow_id)
            if not workflow:
                return None
            if name is not None:
                workflow.name = name
            if description is not None:
                workflow.description = description
            if graph is not None:
                workflow.graph = graph
            await session.flush()
            await session.refresh(workflow)
            return workflow

    async def delete_workflow(self, workflow_id: int) -> bool:
        async with session_scope() as session:
            workflow = await session.get(WorkflowDefinition, workflow_id)
            if not workflow:
                return False
            await session.delete(workflow)
            return True

    async def run_workflow(self, workflow_id: int, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        async with session_scope() as session:
            workflow = await session.get(WorkflowDefinition, workflow_id)
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            project = await session.get(Project, workflow.project_id)

        graph = workflow.graph or {}
        nodes: List[Dict[str, Any]] = graph.get("nodes") or []
        edges: List[Dict[str, Any]] = graph.get("edges") or []
        if not nodes:
            raise ValueError("Workflow graph has no nodes")

        nodes_by_id: Dict[str, Dict[str, Any]] = {}
        for node in nodes:
            node_id = str(node.get("id") or "").strip()
            if node_id:
                nodes_by_id[node_id] = node

        if not nodes_by_id:
            raise ValueError("Workflow graph has no valid node IDs")

        entrypoint: Optional[str] = graph.get("entrypoint")
        if not entrypoint:
            entrypoint = next(iter(nodes_by_id.keys()))

        context: Dict[str, Any] = {
            "input": input_data or {},
            "nodes": {},
            "last_output": None,
        }

        node_results: Dict[str, Any] = {}
        visited: set[str] = set()
        current_id: Optional[str] = entrypoint

        success = True
        error: Optional[str] = None

        while current_id:
            if current_id in visited:
                success = False
                error = f"Cycle detected at node '{current_id}'"
                break
            visited.add(current_id)

            node = nodes_by_id.get(current_id)
            if not node:
                success = False
                error = f"Node '{current_id}' not found in graph"
                break

            try:
                result = await self._execute_node(node, context, project_name=project.name if project else f"project_{workflow.project_id}")
                node_results[current_id] = result
                context["nodes"][current_id] = result
                if result.get("success"):
                    context["last_output"] = result.get("output")
                else:
                    success = False
                    error = result.get("error") or "Node execution failed"
                    break
            except Exception as exc:  # pragma: no cover - defensive
                success = False
                error = str(exc)
                node_results[current_id] = {"success": False, "error": error}
                break

            next_id: Optional[str] = None
            for edge in edges:
                if str(edge.get("source")) == current_id:
                    next_id = str(edge.get("target")) if edge.get("target") is not None else None
                    if next_id:
                        break
            if not next_id:
                break
            current_id = next_id

        return {
            "workflow_id": workflow_id,
            "success": success,
            "error": error,
            "node_results": node_results,
            "last_output": context.get("last_output"),
        }

    async def _execute_node(self, node: Dict[str, Any], context: Dict[str, Any], project_name: str) -> Dict[str, Any]:
        node_type = str(node.get("type") or "").lower()
        node_id = str(node.get("id") or "")
        raw_config: Dict[str, Any] = node.get("config") or {}

        template_ctx = {
            "input": context.get("input") or {},
            "nodes": context.get("nodes") or {},
            "last_output": context.get("last_output"),
        }
        config = self._render_value(raw_config, template_ctx)

        if node_type == "llm":
            return await self._execute_llm_node(node_id, config)
        if node_type == "tool":
            return await self._execute_tool_node(node_id, config, project_name)
        if node_type == "http":
            return await self._execute_http_node(node_id, config)
        if node_type == "wait":
            return await self._execute_wait_node(node_id, config)
        if node_type == "python":
            return await self._execute_python_node(node_id, config, context)
        if node_type == "javascript":
            return await self._execute_js_node(node_id, config, context)

        return {"success": False, "error": f"Unsupported node type: {node_type}"}

    async def _execute_llm_node(self, node_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        provider_value = config.get("provider") or ProviderType.OPENAI.value
        try:
            provider_type = ProviderType(provider_value)
        except ValueError:
            return {"success": False, "error": f"Invalid provider: {provider_value}"}

        model_name = config.get("model_name")
        temperature = float(config.get("temperature", 0.7))
        max_tokens = int(config.get("max_tokens", 512))
        system_prompt = config.get("system_prompt") or "You are a helpful AI assistant."
        user_prompt = config.get("prompt") or config.get("prompt_template") or ""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        provider = get_provider(provider_type, model_name)
        used_key: Dict[str, Optional[int]] = {"id": None}

        async def _invoke(api_key: str, key_id: int):
            used_key["id"] = key_id
            return await provider.generate(
                api_key=api_key,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                tools=None,
            )

        result = await provider_manager.rotate_until_success(provider_type, _invoke)
        text = result.get("text", "")

        return {
            "success": True,
            "output": text,
            "usage": result.get("usage", {}),
            "tool_calls": result.get("tool_calls", []),
            "used_key_id": used_key.get("id"),
        }

    async def _execute_tool_node(self, node_id: str, config: Dict[str, Any], project_name: str) -> Dict[str, Any]:
        tool_name = config.get("tool_name") or config.get("name")
        arguments = config.get("arguments") or {}
        project_id = int(config.get("project_id", 0))

        if not tool_name:
            return {"success": False, "error": "Tool name is required"}
        if not project_id:
            return {"success": False, "error": "project_id is required for tool nodes"}

        result = await tool_service.execute(
            project_id=project_id,
            project_name=project_name,
            tool_name=tool_name,
            arguments=arguments,
        )
        return {
            "success": result.success,
            "output": result.output,
            "description": result.description,
        }

    async def _execute_http_node(self, node_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        method = str(config.get("method", "GET")).upper()
        url = config.get("url")
        headers = config.get("headers") or {}
        params = config.get("params") or None
        body = config.get("body")
        timeout_seconds = int(config.get("timeout_seconds", 30))

        if not url:
            return {"success": False, "error": "URL is required for HTTP node"}

        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.request(method, url, headers=headers, params=params, json=body)
                response.raise_for_status()
                try:
                    data = response.json()
                except ValueError:
                    data = response.text
        except Exception as exc:  # pragma: no cover - network dependent
            return {"success": False, "error": str(exc)}

        return {"success": True, "output": data, "status_code": response.status_code}

    async def _execute_wait_node(self, node_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        seconds = float(config.get("seconds", 0))
        if seconds < 0:
            seconds = 0
        await asyncio.sleep(seconds)
        return {"success": True, "output": None}

    async def _execute_python_node(self, node_id: str, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute arbitrary Python code in a restricted environment.

        This is intentionally gated behind the `enable_unsafe_exec` setting and is
        intended only for trusted, self-hosted environments.
        """

        if not self.settings.enable_unsafe_exec:
            return {
                "success": False,
                "error": "Python execution is disabled. Set enable_unsafe_exec=True to allow it.",
            }

        code = config.get("code") or config.get("source")
        if not code:
            return {"success": False, "error": "Python node requires 'code' in config"}

        output_var = config.get("output_variable", "result")

        # Inputs: allow passing explicit inputs, otherwise expose last_output and full context.
        inputs = config.get("inputs") or {}
        if not inputs:
            inputs = {
                "last_output": context.get("last_output"),
                "nodes": context.get("nodes"),
                "input": context.get("input"),
            }

        # Very small set of safe builtins; this is NOT a full sandbox, but reduces risk.
        safe_builtins: Dict[str, Any] = {
            "len": len,
            "range": range,
            "min": min,
            "max": max,
            "sum": sum,
            "sorted": sorted,
            "str": str,
            "int": int,
            "float": float,
            "bool": bool,
            "dict": dict,
            "list": list,
            "set": set,
            "tuple": tuple,
            "enumerate": enumerate,
            "zip": zip,
        }

        globals_dict: Dict[str, Any] = {"__builtins__": safe_builtins}
        locals_dict: Dict[str, Any] = {
            "context": context,
            "ctx": context,
            **inputs,
        }

        try:
            exec(code, globals_dict, locals_dict)
        except Exception as exc:  # pragma: no cover - user code
            return {"success": False, "error": f"Python execution error: {exc}"}

        output = locals_dict.get(output_var)
        return {"success": True, "output": output}

    async def _execute_js_node(self, node_id: str, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute JavaScript code via a Node.js subprocess.

        Also gated behind `enable_unsafe_exec` and intended for trusted environments
        where Node.js is available on the PATH.
        """

        if not self.settings.enable_unsafe_exec:
            return {
                "success": False,
                "error": "JavaScript execution is disabled. Set enable_unsafe_exec=True to allow it.",
            }

        code = config.get("code") or config.get("source")
        if not code:
            return {"success": False, "error": "JavaScript node requires 'code' in config"}

        payload: Dict[str, Any] = {
            "input": config.get("input"),
            "nodes": context.get("nodes"),
            "last_output": context.get("last_output"),
        }

        try:
            payload_json = json.dumps(payload, default=str)
        except TypeError as exc:  # pragma: no cover - defensive
            return {"success": False, "error": f"Failed to serialize JS input: {exc}"}

        # Wrap user code so that it can assign to `result` and we capture it.
        script = (
            "const data = JSON.parse(process.argv[2]);\n"  # noqa: E501
            "let result = null;\n"  # noqa: E501
            "(async () => {\n"  # noqa: E501
            f"{code}\n"  # user code; may set `result`
            "if (typeof result === 'undefined') {\n"  # noqa: E501
            "  console.log(JSON.stringify({ output: null }));\n"  # noqa: E501
            "} else {\n"  # noqa: E501
            "  console.log(JSON.stringify({ output: result }));\n"  # noqa: E501
            "}\n"  # noqa: E501
            "})().catch(err => {\n"  # noqa: E501
            "  console.error(err);\n"  # noqa: E501
            "  process.exit(1);\n"  # noqa: E501
            "});\n"  # noqa: E501
        )

        def _run_node() -> Dict[str, Any]:
            try:
                completed = subprocess.run(
                    ["node", "-e", script, payload_json],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
            except Exception as exc:  # pragma: no cover - environment dependent
                return {"success": False, "error": f"Failed to start Node.js: {exc}"}

            if completed.returncode != 0:
                stderr = (completed.stderr or "").strip()
                return {
                    "success": False,
                    "error": stderr or f"Node.js exited with code {completed.returncode}",
                }

            stdout = (completed.stdout or "").strip()
            if not stdout:
                return {"success": True, "output": None}

            try:
                data = json.loads(stdout)
            except json.JSONDecodeError:
                # If user printed something non-JSON, return raw text.
                return {"success": True, "output": stdout}

            return {"success": True, "output": data.get("output", data)}

        result: Dict[str, Any] = await asyncio.to_thread(_run_node)
        return result

    def _render_value(self, value: Any, context: Dict[str, Any]) -> Any:
        """Recursively render template expressions in strings within a structure.

        Supported syntax: "...{{path.to.value}}..." where path is dot-separated keys
        into the provided context dict.
        """

        if isinstance(value, str):
            pattern = re.compile(r"\{\{([^}]+)\}\}")

            def replace(match: re.Match[str]) -> str:
                expr = match.group(1).strip()
                resolved = self._resolve_expr(expr, context)
                return "" if resolved is None else str(resolved)

            return pattern.sub(replace, value)
        if isinstance(value, dict):
            return {k: self._render_value(v, context) for k, v in value.items()}
        if isinstance(value, list):
            return [self._render_value(v, context) for v in value]
        return value

    def _resolve_expr(self, expr: str, context: Dict[str, Any]) -> Any:
        parts = [part for part in expr.split(".") if part]
        current: Any = context
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current


workflow_service = WorkflowService()

from __future__ import annotations

import asyncio
import contextlib
import io
import textwrap
from typing import Any, Dict

from ..base import Tool, ToolContext, ToolResult

SAFE_BUILTINS = {
    "abs": abs,
    "min": min,
    "max": max,
    "sum": sum,
    "len": len,
    "range": range,
    "enumerate": enumerate,
    "sorted": sorted,
}


class CodeExecutionTool(Tool):
    """Execute Python code snippets inside a restricted sandbox."""

    def __init__(self) -> None:
        super().__init__(
            name="code_executor",
            description="Execute short Python snippets in a sandboxed environment.",
        )

    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        code = arguments.get("code")
        if not code:
            return ToolResult(success=False, output=None, description="'code' argument required")

        code = textwrap.dedent(str(code))

        try:
            stdout_buffer = io.StringIO()
            stderr_buffer = io.StringIO()

            def _execute() -> Dict[str, Any]:
                local_vars: Dict[str, Any] = {}
                with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
                    exec(  # noqa: S102 - controlled sandbox
                        code,
                        {"__builtins__": SAFE_BUILTINS},
                        local_vars,
                    )
                return {
                    "stdout": stdout_buffer.getvalue(),
                    "stderr": stderr_buffer.getvalue(),
                    "locals": {k: v for k, v in local_vars.items() if _is_json_serializable(v)},
                }

            result = await asyncio.to_thread(_execute)
            return ToolResult(success=True, output=result)
        except Exception as exc:  # pragma: no cover - user code variability
            return ToolResult(success=False, output=None, description=str(exc))


def _is_json_serializable(value: Any) -> bool:
    try:
        import json

        json.dumps(value)
        return True
    except Exception:
        return False

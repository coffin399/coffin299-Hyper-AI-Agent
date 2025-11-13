from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Dict, List

from ..base import Tool, ToolContext, ToolResult


class FileSystemTool(Tool):
    """Perform sandboxed file operations within the project workspace."""

    def __init__(self) -> None:
        super().__init__(
            name="filesystem",
            description="Read, write, and list files within the project sandbox.",
        )

    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        action = (arguments.get("action") or "list").lower()
        workspace = self._workspace_path(context)

        try:
            if action == "list":
                depth = int(arguments.get("depth", 2))
                entries = await asyncio.to_thread(self._list_files, workspace, depth)
                return ToolResult(success=True, output=entries)

            if action in {"read", "write", "append", "delete", "mkdir"}:
                relative = arguments.get("path")
                if not relative:
                    return ToolResult(success=False, output=None, description="'path' argument required")
                target = self._resolve_path(workspace, relative)

                if action == "read":
                    mode = arguments.get("mode", "text")
                    data = await asyncio.to_thread(self._read_file, target, mode)
                    return ToolResult(success=True, output=data)

                if action == "write":
                    content = arguments.get("content")
                    if content is None:
                        return ToolResult(success=False, output=None, description="'content' required for write")
                    await asyncio.to_thread(self._write_file, target, str(content), append=False)
                    return ToolResult(success=True, output={"path": str(target.relative_to(workspace))})

                if action == "append":
                    content = arguments.get("content")
                    if content is None:
                        return ToolResult(success=False, output=None, description="'content' required for append")
                    await asyncio.to_thread(self._write_file, target, str(content), append=True)
                    return ToolResult(success=True, output={"path": str(target.relative_to(workspace))})

                if action == "delete":
                    await asyncio.to_thread(self._delete_path, target)
                    return ToolResult(success=True, output={"deleted": str(target.relative_to(workspace))})

                if action == "mkdir":
                    await asyncio.to_thread(target.mkdir, parents=True, exist_ok=True)
                    return ToolResult(success=True, output={"directory": str(target.relative_to(workspace))})

            return ToolResult(success=False, output=None, description=f"Unsupported action '{action}'")
        except Exception as exc:  # pragma: no cover - filesystem edge cases
            return ToolResult(success=False, output=None, description=str(exc))

    @staticmethod
    def _workspace_path(context: ToolContext) -> Path:
        base = Path(context.data_dir)
        workspace = base / f"project_{context.project_id}"
        workspace.mkdir(parents=True, exist_ok=True)
        return workspace.resolve()

    @staticmethod
    def _resolve_path(workspace: Path, relative_path: str) -> Path:
        target = (workspace / relative_path).resolve()
        if workspace not in target.parents and target != workspace:
            raise ValueError("Access outside project workspace is not allowed")
        return target

    @staticmethod
    def _list_files(workspace: Path, depth: int) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for path in workspace.rglob("*"):
            relative = str(path.relative_to(workspace))
            if relative == ".":
                continue
            if path.is_dir() and path.relative_to(workspace).parts and len(path.relative_to(workspace).parts) > depth:
                continue
            entry = {
                "path": relative,
                "is_dir": path.is_dir(),
                "size": path.stat().st_size if path.is_file() else None,
            }
            results.append(entry)
        return results

    @staticmethod
    def _read_file(target: Path, mode: str) -> Any:
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(str(target))
        if mode == "bytes":
            return target.read_bytes()
        return target.read_text(encoding="utf-8")

    @staticmethod
    def _write_file(target: Path, content: str, append: bool) -> None:
        target.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if append and target.exists() else "w"
        target.open(mode, encoding="utf-8").write(content)

    @staticmethod
    def _delete_path(target: Path) -> None:
        if target.is_dir():
            for child in target.iterdir():
                if child.is_dir():
                    FileSystemTool._delete_path(child)
                else:
                    child.unlink()
            target.rmdir()
        elif target.exists():
            target.unlink()

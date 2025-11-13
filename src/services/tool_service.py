from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Select, select

from ..core.config import get_settings
from ..core.database import session_scope
from ..core.models import ToolExecutionLog
from ..tools.base import Tool, ToolContext, ToolResult
from ..tools.builtins import (
    CalendarTool,
    CodeExecutionTool,
    DatabaseTool,
    EmailTool,
    FileSystemTool,
    WebScraperTool,
)


class ToolService:
    """Discover, register, and execute tools with logging."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._registry: Dict[str, Tool] = {}
        self._register_builtins()

    def _register_builtins(self) -> None:
        self.register(FileSystemTool())
        self.register(WebScraperTool())
        self.register(CalendarTool())
        self.register(EmailTool())
        self.register(CodeExecutionTool())
        self.register(DatabaseTool())

    def register(self, tool: Tool) -> None:
        self._registry[tool.name] = tool

    def list_tools(self) -> List[Dict[str, Any]]:
        return [tool.to_definition() for tool in self._registry.values()]

    async def execute(
        self,
        project_id: int,
        project_name: str,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> ToolResult:
        tool = self._registry.get(tool_name)
        if not tool:
            return ToolResult(success=False, output=None, description=f"Tool '{tool_name}' not found")

        context = ToolContext(
            project_id=project_id,
            project_name=project_name,
            data_dir=str(self.settings.data_dir),
        )

        start = datetime.utcnow()
        try:
            result = await tool.run(context, arguments)
            status = "success" if result.success else "failed"
            output_json = json.dumps(result.output) if result.output is not None else None
            await self._log_execution(
                project_id=project_id,
                tool_name=tool_name,
                arguments=arguments,
                output_json=output_json,
                status=status,
                start=start,
            )
            return result
        except Exception as exc:  # pragma: no cover - defensive
            await self._log_execution(
                project_id=project_id,
                tool_name=tool_name,
                arguments=arguments,
                output_json=None,
                status="error",
                start=start,
            )
            return ToolResult(success=False, output=None, description=str(exc))

    async def _log_execution(
        self,
        project_id: int,
        tool_name: str,
        arguments: Dict[str, Any],
        output_json: Optional[str],
        status: str,
        start: datetime,
    ) -> None:
        async with session_scope() as session:
            log = ToolExecutionLog(
                project_id=project_id,
                tool_name=tool_name,
                arguments_json=json.dumps(arguments),
                output_json=output_json,
                status=status,
                created_at=start,
            )
            session.add(log)
            await session.flush()

    async def get_logs(self, project_id: int, limit: Optional[int] = None) -> List[ToolExecutionLog]:
        async with session_scope() as session:
            stmt: Select = (
                select(ToolExecutionLog)
                .where(ToolExecutionLog.project_id == project_id)
                .order_by(ToolExecutionLog.created_at.desc())
            )
            if limit:
                stmt = stmt.limit(limit)
            result = await session.scalars(stmt)
            return list(result)


tool_service = ToolService()

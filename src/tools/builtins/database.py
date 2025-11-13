from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Optional

from sqlalchemy import Select, delete, insert, select, text, update
from sqlalchemy.exc import SQLAlchemyError

from ..base import Tool, ToolContext, ToolResult


class DatabaseTool(Tool):
    """Run read-only SQL queries against the internal SQLite database."""

    def __init__(self) -> None:
        super().__init__(
            name="database",
            description="Execute read-only SQL queries against the internal SQLite database.",
        )

    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        query = arguments.get("query")
        if not query:
            return ToolResult(success=False, output=None, description="'query' argument required")

        query_str = str(query).strip()
        if not query_str:
            return ToolResult(success=False, output=None, description="Empty query")

        normalized = query_str.lower()
        if any(normalized.startswith(kw) for kw in ("insert", "update", "delete", "drop", "alter", "create", "truncate")):
            return ToolResult(success=False, output=None, description="Only SELECT queries are allowed")

        try:
            from ...core.database import session_scope

            async with session_scope() as session:
                result = await session.execute(text(query_str))
                if result.returns_rows:
                    rows = result.fetchall()
                    columns = list(result.keys())
                    rows_json = [dict(zip(columns, row)) for row in rows]
                    return ToolResult(success=True, output={"columns": columns, "rows": rows_json})
                else:
                    return ToolResult(success=True, output={"affected_rows": result.rowcount})
        except SQLAlchemyError as exc:  # pragma: no cover - SQL errors
            return ToolResult(success=False, output=None, description=str(exc))
        except Exception as exc:  # pragma: no cover - unexpected
            return ToolResult(success=False, output=None, description=str(exc))

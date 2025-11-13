from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from ...services.calendar_service import CalendarService, calendar_service
from ..base import Tool, ToolContext, ToolResult


class CalendarTool(Tool):
    """Create, list, and delete project calendar events."""

    def __init__(self, service: CalendarService | None = None) -> None:
        super().__init__(
            name="calendar",
            description="Manage project calendar events (create/list/delete).",
        )
        self.service = service or calendar_service

    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        action = (arguments.get("action") or "list").lower()

        try:
            if action == "create":
                title = arguments.get("title")
                start_time = arguments.get("start_time")
                if not title or not start_time:
                    return ToolResult(success=False, output=None, description="'title' and 'start_time' required")

                start_dt = self._parse_datetime(start_time)
                end_dt = self._parse_optional_datetime(arguments.get("end_time"))
                description = arguments.get("description")
                metadata = arguments.get("metadata")

                event = await self.service.create_event(
                    project_id=context.project_id,
                    title=title,
                    start_time=start_dt,
                    end_time=end_dt,
                    description=description,
                    metadata=metadata,
                )
                return ToolResult(success=True, output=self._serialize_event(event))

            if action == "list":
                limit = arguments.get("limit")
                events = await self.service.list_events(
                    project_id=context.project_id,
                    limit=int(limit) if limit else None,
                )
                return ToolResult(success=True, output=[self._serialize_event(evt) for evt in events])

            if action == "delete":
                event_id = arguments.get("event_id")
                if not event_id:
                    return ToolResult(success=False, output=None, description="'event_id' required")
                deleted = await self.service.delete_event(context.project_id, int(event_id))
                if not deleted:
                    return ToolResult(success=False, output=None, description="Event not found")
                return ToolResult(success=True, output={"deleted": int(event_id)})

            return ToolResult(success=False, output=None, description=f"Unsupported action '{action}'")
        except Exception as exc:  # pragma: no cover - defensive
            return ToolResult(success=False, output=None, description=str(exc))

    @staticmethod
    def _parse_datetime(value: str) -> datetime:
        return datetime.fromisoformat(value)

    @staticmethod
    def _parse_optional_datetime(value: Optional[str]) -> Optional[datetime]:
        if value is None:
            return None
        return datetime.fromisoformat(value)

    @staticmethod
    def _serialize_event(event) -> Dict[str, Any]:
        metadata = None
        if event.metadata_json:
            try:
                import json

                metadata = json.loads(event.metadata_json)
            except Exception:  # pragma: no cover - defensive
                metadata = event.metadata_json
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "metadata": metadata,
        }

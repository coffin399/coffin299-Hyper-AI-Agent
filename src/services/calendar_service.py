from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import json

from sqlalchemy import Select, delete, select

from ..core.database import session_scope
from ..core.models import CalendarEvent


class CalendarService:
    """Manage calendar events stored for each project."""

    async def create_event(
        self,
        project_id: int,
        title: str,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> CalendarEvent:
        async with session_scope() as session:
            event = CalendarEvent(
                project_id=project_id,
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                metadata_json=json.dumps(metadata) if metadata else None,
            )
            session.add(event)
            await session.flush()
            await session.refresh(event)
            return event

    async def list_events(
        self,
        project_id: int,
        limit: Optional[int] = None,
    ) -> List[CalendarEvent]:
        async with session_scope() as session:
            stmt: Select = (
                select(CalendarEvent)
                .where(CalendarEvent.project_id == project_id)
                .order_by(CalendarEvent.start_time.desc())
            )
            if limit:
                stmt = stmt.limit(limit)
            result = await session.scalars(stmt)
            return list(result)

    async def delete_event(self, project_id: int, event_id: int) -> bool:
        async with session_scope() as session:
            stmt = (
                delete(CalendarEvent)
                .where(CalendarEvent.project_id == project_id, CalendarEvent.id == event_id)
            )
            result = await session.execute(stmt)
            return result.rowcount > 0


calendar_service = CalendarService()

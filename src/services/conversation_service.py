from __future__ import annotations

from collections import deque
from datetime import datetime
from typing import Iterable, Optional
import json

from sqlalchemy import Select, func, select

from ..core.database import session_scope
from ..core.models import (
    Conversation,
    ConversationMessage,
    MemoryRecord,
    MemoryTag,
    Project,
    ProviderType,
    Tag,
    UsageRecord,
)

MAX_CONTEXT_MESSAGES = 50


class ConversationService:
    """Manage projects, conversations, messages, and long-term memories."""

    async def ensure_project(self, name: str, description: Optional[str] = None) -> Project:
        async with session_scope() as session:
            stmt = select(Project).where(Project.name == name)
            project = await session.scalar(stmt)
            if project:
                if description and project.description != description:
                    project.description = description
                return project

            project = Project(name=name, description=description)
            session.add(project)
            await session.flush()
            return project

    async def create_conversation(
        self,
        project_id: int,
        provider: ProviderType,
        model_name: str,
        title: Optional[str] = None,
    ) -> Conversation:
        async with session_scope() as session:
            conversation = Conversation(
                project_id=project_id,
                provider=provider,
                model_name=model_name,
                title=title,
            )
            session.add(conversation)
            await session.flush()
            return conversation

    async def get_conversation(self, conversation_id: int) -> Optional[Conversation]:
        async with session_scope() as session:
            return await session.get(Conversation, conversation_id)

    async def update_conversation_model(self, conversation_id: int, model_name: str) -> Optional[Conversation]:
        async with session_scope() as session:
            convo = await session.get(Conversation, conversation_id)
            if not convo:
                return None
            convo.model_name = model_name
            await session.flush()
            await session.refresh(convo)
            return convo

    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        token_usage: Optional[int] = None,
    ) -> ConversationMessage:
        async with session_scope() as session:
            message = ConversationMessage(
                conversation_id=conversation_id,
                role=role,
                content=content,
                token_usage=token_usage,
            )
            session.add(message)
            await session.flush()
            return message

    async def get_recent_messages(
        self,
        conversation_id: int,
        limit: int,
    ) -> list[ConversationMessage]:
        async with session_scope() as session:
            stmt: Select = (
                select(ConversationMessage)
                .where(ConversationMessage.conversation_id == conversation_id)
                .order_by(ConversationMessage.created_at.desc())
                .limit(limit)
            )
            result = await session.scalars(stmt)
            items = list(result)
            items.reverse()
            return items

    async def save_summary(self, conversation_id: int, summary: str) -> None:
        async with session_scope() as session:
            convo = await session.get(Conversation, conversation_id)
            if not convo:
                return
            convo.summary = summary

    async def count_messages(self, conversation_id: int) -> int:
        async with session_scope() as session:
            stmt = (
                select(func.count(ConversationMessage.id))
                .where(ConversationMessage.conversation_id == conversation_id)
            )
            result = await session.execute(stmt)
            return result.scalar_one()

    async def store_memory(
        self,
        project_id: int,
        content: str,
        summary: Optional[str],
        embedding: Optional[bytes],
        tags: Optional[Iterable[str]] = None,
        metadata: Optional[dict] = None,
    ) -> MemoryRecord:
        async with session_scope() as session:
            memory = MemoryRecord(
                project_id=project_id,
                content=content,
                summary=summary,
                embedding=embedding,
                metadata_json=json.dumps(metadata) if metadata else None,
            )
            session.add(memory)
            await session.flush()

            if tags:
                for label in tags:
                    normalized = label.strip()
                    if not normalized:
                        continue
                    tag_stmt = select(Tag).where(Tag.label == normalized)
                    tag = await session.scalar(tag_stmt)
                    if not tag:
                        tag = Tag(label=normalized)
                        session.add(tag)
                        await session.flush()
                    link = MemoryTag(memory_id=memory.id, tag_id=tag.id)
                    session.add(link)
            return memory

    async def list_memories(
        self,
        project_id: int,
        limit: Optional[int] = None,
    ) -> list[MemoryRecord]:
        async with session_scope() as session:
            stmt: Select = (
                select(MemoryRecord)
                .where(MemoryRecord.project_id == project_id)
                .order_by(MemoryRecord.created_at.desc())
            )
            if limit:
                stmt = stmt.limit(limit)
            result = await session.scalars(stmt)
            return list(result)

    async def record_usage(
        self,
        project_id: int,
        provider: ProviderType,
        model_name: str,
        tokens_prompt: int,
        tokens_completion: int,
        total_cost: Optional[float] = None,
        metadata: Optional[dict] = None,
    ) -> UsageRecord:
        async with session_scope() as session:
            record = UsageRecord(
                project_id=project_id,
                provider=provider,
                model_name=model_name,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                total_cost=total_cost,
                usage_metadata=metadata,
            )
            session.add(record)
            await session.flush()
            return record

    async def list_conversation_context(self, conversation_id: int, limit: int = MAX_CONTEXT_MESSAGES) -> list[dict]:
        messages = await self.get_recent_messages(conversation_id, limit)
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]


conversation_service = ConversationService()

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional

from ...core.agent import ChatRequest, ChatResponse, HyperAIAgent
from ...services.conversation_service import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])

agent = HyperAIAgent()


class ConversationCreate(BaseModel):
    project_name: str
    project_description: Optional[str] = None
    provider: str
    model_name: Optional[str] = None


class ConversationMessage(BaseModel):
    role: str
    content: str
    created_at: str


class ConversationResponse(BaseModel):
    id: int
    project_id: int
    title: Optional[str]
    provider: str
    model_name: str
    created_at: str
    updated_at: str


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: int):
    conv = await conversation_service.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse(
        id=conv.id,
        project_id=conv.project_id,
        title=conv.title,
        provider=conv.provider.value,
        model_name=conv.model_name,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
    )


@router.get("/{conversation_id}/messages", response_model=List[ConversationMessage])
async def get_messages(conversation_id: int, limit: Optional[int] = Query(None)):
    msgs = await conversation_service.get_recent_messages(conversation_id, limit=limit or 100)
    return [
        ConversationMessage(
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at.isoformat(),
        )
        for msg in msgs
    ]


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        return await agent.process_chat(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

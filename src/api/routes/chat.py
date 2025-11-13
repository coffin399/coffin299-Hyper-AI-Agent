from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field(None, description="チャットタイトル")
    model: str = Field(default="gpt-3.5-turbo", description="AIモデル")
    system_prompt: Optional[str] = Field(None, description="システムプロンプト")


class SendMessageRequest(BaseModel):
    session_id: str = Field(..., description="セッションID")
    message: str = Field(..., description="メッセージ内容")
    role: str = Field(default="user", description="メッセージの役割")


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = Field(None, description="チャットタイトル")
    system_prompt: Optional[str] = Field(None, description="システムプロンプト")


@router.post("/sessions")
async def create_session(request: CreateSessionRequest):
    """新しいチャットセッションを作成"""
    try:
        result = await chat_service.create_session(
            request.title,
            request.model,
            request.system_prompt
        )
        return {"session": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions")
async def get_sessions():
    """全チャットセッションを取得"""
    try:
        sessions = await chat_service.get_sessions()
        return {"sessions": sessions}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """特定のチャットセッションを取得"""
    try:
        session = await chat_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"session": session}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """チャットセッションを削除"""
    try:
        success = await chat_service.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send")
async def send_message(request: SendMessageRequest):
    """メッセージを送信してAI応答を取得"""
    try:
        result = await chat_service.send_message(
            request.session_id,
            request.message,
            request.role
        )
        return {"response": result}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/sessions/{session_id}")
async def update_session(session_id: str, request: UpdateSessionRequest):
    """チャットセッションを更新"""
    try:
        success = await chat_service.update_session(
            session_id,
            request.title,
            request.system_prompt
        )
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"status": "updated"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/models")
async def get_available_models():
    """利用可能なAIモデル一覧を取得"""
    try:
        models = await chat_service.get_available_models()
        return {"models": models}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions/{session_id}/export")
async def export_session(session_id: str, format: str = "json"):
    """チャットセッションをエクスポート"""
    try:
        if format not in ["json", "markdown", "txt"]:
            raise HTTPException(status_code=400, detail="Unsupported export format")
        
        exported_data = await chat_service.export_session(session_id, format)
        return {
            "session_id": session_id,
            "format": format,
            "data": exported_data
        }
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions/{session_id}/search")
async def search_messages(session_id: str, query: str, limit: int = 10):
    """メッセージを検索"""
    try:
        if limit < 1 or limit > 100:
            raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
        
        results = await chat_service.search_messages(session_id, query, limit)
        return {"results": results, "query": query, "limit": limit}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/sessions/{session_id}/regenerate")
async def regenerate_response(session_id: str):
    """最後のAI応答を再生成"""
    try:
        session = await chat_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # 最後のユーザーメッセージを取得
        messages = session["messages"]
        user_messages = [msg for msg in messages if msg["role"] == "user"]
        
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user messages found")
        
        last_user_message = user_messages[-1]
        
        # 最後のアシスタントメッセージを削除して再生成
        from ...services.chat_service import ChatSession
        chat_session = chat_service.sessions.get(session_id)
        if chat_session and len(chat_session.messages) >= 2:
            # 最後の2つのメッセージ（ユーザーとアシスタント）を削除
            chat_session.messages = chat_session.messages[:-2]
        
        # 新しい応答を生成
        result = await chat_service.send_message(
            session_id,
            last_user_message["content"],
            "user"
        )
        
        return {"response": result}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

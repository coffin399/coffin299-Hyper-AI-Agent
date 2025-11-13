from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.meeting_service import meeting_service

router = APIRouter(prefix="/meeting", tags=["meeting"])


class TranscriptionRequest(BaseModel):
    audio_file_path: str = Field(..., description="音声ファイルパス")
    language: str = Field(default="ja", description="言語コード")


class SummaryRequest(BaseModel):
    transcription: str = Field(..., description="文字起こしテキスト")
    meeting_type: str = Field(default="general", description="会議タイプ")
    participants: List[str] = Field(default_factory=list, description="参加者リスト")


class MinutesRequest(BaseModel):
    meeting_data: Dict[str, Any] = Field(..., description="会議データ")
    template: str = Field(default="standard", description="議事録テンプレート")


@router.post("/transcribe")
async def transcribe_audio(request: TranscriptionRequest):
    """音声を文字起こし"""
    try:
        result = await meeting_service.transcribe_audio(
            request.audio_file_path,
            request.language
        )
        return {"transcription": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/summarize")
async def generate_summary(request: SummaryRequest):
    """会議要約を生成"""
    try:
        result = await meeting_service.generate_meeting_summary(
            request.transcription,
            request.meeting_type,
            request.participants
        )
        return {"summary": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract-actions")
async def extract_action_items(transcription: str):
    """アクションアイテムを抽出"""
    try:
        result = await meeting_service.extract_action_items(transcription)
        return {"action_items": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-minutes")
async def generate_minutes(request: MinutesRequest):
    """議事録を生成"""
    try:
        minutes = await meeting_service.generate_meeting_minutes(
            request.meeting_data,
            request.template
        )
        return {"minutes": minutes}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """音声ファイルをアップロード"""
    try:
        # 実際の実装ではファイルを保存
        content = await file.read()
        
        # ファイルタイプを検証
        allowed_types = [
            "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
            "audio/x-m4a", "audio/aac"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # 一時ファイルとして保存（実際の実装では永続ストレージに保存）
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            tmp_file.write(content)
            file_path = tmp_file.name
        
        return {
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "file_path": file_path,
            "message": "Audio file uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/templates")
async def get_meeting_templates():
    """会議テンプレート一覧を取得"""
    try:
        templates = await meeting_service.get_meeting_templates()
        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/process-meeting")
async def process_complete_meeting(
    audio_file: UploadFile = File(...),
    meeting_type: str = "general",
    participants: str = "",  # カンマ区切りの参加者
    template: str = "standard"
):
    """音声ファイルから完全な会議処理を実行"""
    try:
        # 1. 音声ファイルをアップロード
        audio_content = await audio_file.read()
        
        # 2. 文字起こし
        transcription_result = await meeting_service.transcribe_audio(
            "temp_audio_file",  # 実際の実装では保存したファイルパス
            "ja"
        )
        
        # 3. 参加者をパース
        participant_list = [p.strip() for p in participants.split(",") if p.strip()]
        
        # 4. 要約生成
        summary_result = await meeting_service.generate_meeting_summary(
            transcription_result["text"],
            meeting_type,
            participant_list
        )
        
        # 5. アクションアイテム抽出
        action_items = await meeting_service.extract_action_items(
            transcription_result["text"]
        )
        
        # 6. 議事録生成
        meeting_data = {
            "title": summary_result["title"],
            "overview": summary_result["overview"],
            "key_points": summary_result["key_points"],
            "action_items": summary_result["action_items"],
            "decisions": summary_result["decisions"],
            "next_steps": summary_result["next_steps"],
            "participants": participant_list
        }
        
        minutes = await meeting_service.generate_meeting_minutes(
            meeting_data,
            template
        )
        
        return {
            "transcription": transcription_result,
            "summary": summary_result,
            "action_items": action_items,
            "minutes": minutes,
            "meeting_data": meeting_data
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentGenerateRequest(BaseModel):
    prompt: str = Field(..., description="ドキュメント生成のプロンプト")
    style: str = Field(default="professional", description="スタイル (professional/casual/academic)")


class SpreadsheetGenerateRequest(BaseModel):
    prompt: str = Field(..., description="スプレッドシート生成のプロンプト")
    data_type: str = Field(default="table", description="データタイプ")


class PresentationGenerateRequest(BaseModel):
    prompt: str = Field(..., description="プレゼンテーション生成のプロンプト")
    slide_count: int = Field(default=5, description="スライド枚数")


@router.post("/generate/document")
async def generate_document(request: DocumentGenerateRequest):
    """AIでドキュメントを生成"""
    try:
        result = await document_service.generate_ai_document(request.prompt, request.style)
        return {"document": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/spreadsheet")
async def generate_spreadsheet(request: SpreadsheetGenerateRequest):
    """AIでスプレッドシートを生成"""
    try:
        result = await document_service.generate_ai_spreadsheet(request.prompt, request.data_type)
        return {"spreadsheet": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/presentation")
async def generate_presentation(request: PresentationGenerateRequest):
    """AIでプレゼンテーションを生成"""
    try:
        result = await document_service.generate_ai_presentation(request.prompt, request.slide_count)
        return {"presentation": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/templates/documents")
async def get_document_templates():
    """ドキュメントテンプレート一覧を取得"""
    try:
        templates = await document_service.get_document_templates()
        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/templates/spreadsheets")
async def get_spreadsheet_templates():
    """スプレッドシートテンプレート一覧を取得"""
    try:
        templates = await document_service.get_spreadsheet_templates()
        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/templates/presentations")
async def get_presentation_templates():
    """プレゼンテーションテンプレート一覧を取得"""
    try:
        templates = await document_service.get_presentation_templates()
        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/from-template")
async def generate_from_template(
    template_type: str,
    template_id: str,
    custom_data: Optional[Dict[str, Any]] = None
):
    """テンプレートからドキュメントを生成"""
    try:
        # テンプレートに基づいて生成（拡張機能）
        if template_type == "document":
            prompt = custom_data.get("title", "新しいドキュメント") if custom_data else "新しいドキュメント"
            result = await document_service.generate_ai_document(prompt)
        elif template_type == "spreadsheet":
            prompt = custom_data.get("title", "新しいスプレッドシート") if custom_data else "新しいスプレッドシート"
            result = await document_service.generate_ai_spreadsheet(prompt)
        elif template_type == "presentation":
            prompt = custom_data.get("title", "新しいプレゼンテーション") if custom_data else "新しいプレゼンテーション"
            result = await document_service.generate_ai_presentation(prompt)
        else:
            raise HTTPException(status_code=400, detail="Invalid template type")
        
        return {"document": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

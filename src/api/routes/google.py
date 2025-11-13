from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.google_service import google_service

router = APIRouter(prefix="/google", tags=["google"])


class GoogleAuthRequest(BaseModel):
    client_config: Dict[str, Any]


class GoogleAuthExchangeRequest(BaseModel):
    client_config: Dict[str, Any]
    code: str


class DocumentCreateRequest(BaseModel):
    title: str
    content: Optional[str] = ""


class SpreadsheetCreateRequest(BaseModel):
    title: str
    rows: Optional[List[List[str]]] = None


class PresentationCreateRequest(BaseModel):
    title: str
    slides_data: Optional[List[Dict[str, Any]]] = None


@router.get("/auth/status")
async def get_auth_status():
    """Google認証ステータスを取得"""
    return {
        "authenticated": google_service.is_authenticated(),
        "has_credentials_file": google_service.credentials_file.exists()
    }


@router.post("/auth/url")
async def get_auth_url(request: GoogleAuthRequest):
    """OAuth認証URLを取得"""
    try:
        auth_url = google_service.setup_credentials(request.client_config)
        return {"auth_url": auth_url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/auth/exchange")
async def exchange_code(request: GoogleAuthExchangeRequest):
    """認証コードをトークンに交換"""
    try:
        success = google_service.exchange_code(request.client_config, request.code)
        if success:
            return {"status": "authenticated"}
        else:
            raise HTTPException(status_code=400, detail="Failed to exchange code")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/auth/revoke")
async def revoke_auth():
    """認証情報を削除"""
    try:
        success = google_service.revoke_credentials()
        if success:
            return {"status": "revoked"}
        else:
            raise HTTPException(status_code=500, detail="Failed to revoke credentials")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/drive/files")
async def get_drive_files(query: str = "", page_size: int = 10):
    """Google Driveファイル一覧を取得"""
    try:
        files = await google_service.get_drive_files(query=query, page_size=page_size)
        return {"files": files}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/docs/create")
async def create_document(request: DocumentCreateRequest):
    """Google Docsを作成"""
    try:
        doc = await google_service.create_document(request.title, request.content)
        return {"document": doc}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/docs/{document_id}/content")
async def get_document_content(document_id: str):
    """Google Docsの内容を取得"""
    try:
        content = await google_service.get_document_content(document_id)
        return {"content": content}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/sheets/create")
async def create_spreadsheet(request: SpreadsheetCreateRequest):
    """Google Sheetsを作成"""
    try:
        sheet = await google_service.create_spreadsheet(request.title, request.rows)
        return {"spreadsheet": sheet}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sheets/{spreadsheet_id}/values")
async def get_spreadsheet_values(spreadsheet_id: str, range_name: str = 'Sheet1!A:Z'):
    """Google Sheetsの値を取得"""
    try:
        values = await google_service.get_spreadsheet_values(spreadsheet_id, range_name)
        return {"values": values}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/slides/create")
async def create_presentation(request: PresentationCreateRequest):
    """Google Slidesを作成"""
    try:
        presentation = await google_service.create_presentation(request.title, request.slides_data)
        return {"presentation": presentation}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

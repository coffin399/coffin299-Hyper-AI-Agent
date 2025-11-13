from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.ocr_service import ocr_service

router = APIRouter(prefix="/ocr", tags=["ocr"])


class ImageOCRRequest(BaseModel):
    image_path: str = Field(..., description="画像ファイルパス")
    language: str = Field(default="jpn", description="言語コード")
    preprocess: bool = Field(default=True, description="前処理を実行")


class PDFOCRRequest(BaseModel):
    pdf_path: str = Field(..., description="PDFファイルパス")
    language: str = Field(default="jpn", description="言語コード")
    pages: Optional[List[int]] = Field(None, description="対象ページ番号リスト")


class StructuredExtractionRequest(BaseModel):
    text: str = Field(..., description="抽出対象テキスト")
    extraction_type: str = Field(default="general", description="抽出タイプ")


class TableExtractionRequest(BaseModel):
    image_path: str = Field(..., description="画像ファイルパス")
    table_format: str = Field(default="csv", description="出力フォーマット")


@router.post("/image")
async def extract_text_from_image(request: ImageOCRRequest):
    """画像からテキストを抽出"""
    try:
        result = await ocr_service.extract_text_from_image(
            request.image_path,
            request.language,
            request.preprocess
        )
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/pdf")
async def extract_text_from_pdf(request: PDFOCRRequest):
    """PDFからテキストを抽出"""
    try:
        result = await ocr_service.extract_text_from_pdf(
            request.pdf_path,
            request.language,
            request.pages
        )
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/document")
async def extract_text_from_document(
    document_path: str,
    extract_metadata: bool = True
):
    """ドキュメントからテキストを抽出"""
    try:
        result = await ocr_service.extract_text_from_document(
            document_path,
            extract_metadata
        )
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/structured")
async def extract_structured_data(request: StructuredExtractionRequest):
    """テキストから構造化データを抽出"""
    try:
        result = await ocr_service.extract_structured_data(
            request.text,
            request.extraction_type
        )
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/table")
async def extract_table_data(request: TableExtractionRequest):
    """画像から表データを抽出"""
    try:
        result = await ocr_service.extract_table_data(
            request.image_path,
            request.table_format
        )
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """画像ファイルをアップロード"""
    try:
        content = await file.read()
        
        # ファイルタイプを検証
        allowed_types = [
            "image/jpeg", "image/png", "image/bmp", 
            "image/tiff", "image/webp"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported image format")
        
        # 一時ファイルとして保存
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
            "message": "Image file uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """PDFファイルをアップロード"""
    try:
        content = await file.read()
        
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # 一時ファイルとして保存
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
            "message": "PDF file uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """ドキュメントファイルをアップロード"""
    try:
        content = await file.read()
        
        allowed_types = [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported document format")
        
        # 一時ファイルとして保存
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
            "message": "Document file uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/languages")
async def get_supported_languages():
    """サポートされている言語一覧を取得"""
    try:
        languages = await ocr_service.get_supported_languages()
        return {"languages": languages}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/preprocess")
async def preprocess_image(image_path: str):
    """画像の前処理を実行"""
    try:
        processed_path = await ocr_service.preprocess_image(image_path)
        return {"processed_path": processed_path}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/complete-ocr")
async def complete_ocr_process(
    file: UploadFile = File(...),
    language: str = "jpn",
    extract_structured: bool = False,
    extraction_type: str = "general",
    preprocess: bool = True
):
    """完全なOCR処理を実行"""
    try:
        # 1. ファイルをアップロード
        content = await file.read()
        
        # 2. ファイルタイプを判定
        file_type = None
        if file.content_type.startswith("image/"):
            file_type = "image"
        elif file.content_type == "application/pdf":
            file_type = "pdf"
        elif file.content_type in [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]:
            file_type = "document"
        
        if not file_type:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # 3. 一時ファイルとして保存
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            tmp_file.write(content)
            file_path = tmp_file.name
        
        # 4. OCR処理を実行
        if file_type == "image":
            ocr_result = await ocr_service.extract_text_from_image(
                file_path, language, preprocess
            )
        elif file_type == "pdf":
            ocr_result = await ocr_service.extract_text_from_pdf(
                file_path, language
            )
        else:  # document
            ocr_result = await ocr_service.extract_text_from_document(
                file_path, True
            )
        
        # 5. 構造化データ抽出（オプション）
        structured_data = None
        if extract_structured and ocr_result.get("text"):
            structured_result = await ocr_service.extract_structured_data(
                ocr_result["text"], extraction_type
            )
            structured_data = structured_result["data"]
        
        return {
            "file_info": {
                "filename": file.filename,
                "size": len(content),
                "type": file_type
            },
            "ocr_result": ocr_result,
            "structured_data": structured_data
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

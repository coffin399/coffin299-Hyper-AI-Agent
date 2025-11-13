from __future__ import annotations

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

from ...services.model_service import model_service

router = APIRouter(prefix="/models", tags=["models"])


class ModelDownloadRequest(BaseModel):
    model: str
    quantization: str


class ModelInfo(BaseModel):
    config_key: str
    model: str
    quantization: str
    size_gb: float
    description: str
    path: Optional[str] = None


class SystemInfo(BaseModel):
    platform: str
    ram_gb: float
    recommended_config: str


class ModelConfigInfo(BaseModel):
    description: str
    min_ram_gb: int
    models: List[ModelInfo]


# ダウンロード進捗を管理（簡易実装）
_download_progress: Dict[str, str] = {}


@router.get("/configs", response_model=Dict[str, ModelConfigInfo])
async def get_model_configs():
    """利用可能なモデル設定を取得"""
    configs = model_service.get_available_configs()
    result = {}
    for key, data in configs.items():
        models = [
            ModelInfo(
                config_key=key,
                model=m.model,
                quantization=m.quantization,
                size_gb=m.size_gb,
                description=m.description,
            )
            for m in data["models"]
        ]
        result[key] = ModelConfigInfo(
            description=data["description"],
            min_ram_gb=data["min_ram_gb"],
            models=models,
        )
    return result


@router.get("/downloaded", response_model=List[ModelInfo])
async def get_downloaded_models():
    """ダウンロード済みモデル一覧を取得"""
    models = model_service.get_downloaded_models()
    return [ModelInfo(**m) for m in models]


@router.post("/download")
async def download_model(request: ModelDownloadRequest, background_tasks: BackgroundTasks):
    """モデルをダウンロード"""
    model_key = f"{request.model}:{request.quantization}"
    
    if model_key in _download_progress:
        raise HTTPException(status_code=400, detail="Download already in progress")
    
    _download_progress[model_key] = "starting"
    
    # バックグラウンドでダウンロード開始
    background_tasks.add_task(
        _download_model_background,
        request.model,
        request.quantization,
    )
    
    return {"status": "download_started", "model_key": model_key}


@router.delete("/delete")
async def delete_model(request: ModelDownloadRequest):
    """モデルを削除"""
    success = await model_service.delete_model(request.model, request.quantization)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete model")
    
    model_key = f"{request.model}:{request.quantization}"
    _download_progress.pop(model_key, None)
    
    return {"status": "deleted"}


@router.get("/progress/{model_key}")
async def get_download_progress(model_key: str):
    """ダウンロード進捗を取得"""
    progress = _download_progress.get(model_key, "not_found")
    if progress == "not_found":
        raise HTTPException(status_code=404, detail="Download not found")
    
    return {"model_key": model_key, "progress": progress}


@router.get("/system-info", response_model=SystemInfo)
async def get_system_info():
    """システム情報を取得"""
    info = model_service.get_system_info()
    return SystemInfo(**info)


async def _download_model_background(model: str, quantization: str):
    """バックグラウンドでモデルをダウンロード"""
    model_key = f"{model}:{quantization}"
    
    def progress_callback(message: str):
        _download_progress[model_key] = message
    
    try:
        success = await model_service.download_model(model, quantization, progress_callback)
        if success:
            _download_progress[model_key] = "completed"
        else:
            _download_progress[model_key] = "failed"
    except Exception as e:
        _download_progress[model_key] = f"error: {str(e)}"

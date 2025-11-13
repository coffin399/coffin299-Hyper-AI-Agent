from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.media_service import media_service

router = APIRouter(prefix="/media", tags=["media"])


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., description="画像生成のプロンプト")
    style: str = Field(default="realistic", description="スタイル")
    size: str = Field(default="1024x1024", description="画像サイズ")
    provider: str = Field(default="dalle", description="プロバイダー")


class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., description="動画生成のプロンプト")
    duration: int = Field(default=10, description="動画長（秒）")
    resolution: str = Field(default="720p", description="解像度")
    style: str = Field(default="realistic", description="スタイル")


class AudioClipGenerateRequest(BaseModel):
    text: str = Field(..., description="音声化するテキスト")
    voice: str = Field(default="natural", description="音声スタイル")
    format: str = Field(default="mp3", description="音声フォーマット")
    background_music: bool = Field(default=False, description="背景音楽を含めるか")


class VideoClipGenerateRequest(BaseModel):
    script: str = Field(..., description="動画スクリプト")
    duration: int = Field(default=30, description="動画長（秒）")
    aspect_ratio: str = Field(default="16:9", description="アスペクト比")
    include_subtitles: bool = Field(default=True, description="字幕を含めるか")


@router.post("/generate/image")
async def generate_image(request: ImageGenerateRequest):
    """AIで画像を生成"""
    try:
        result = await media_service.generate_image(
            request.prompt,
            request.style,
            request.size,
            request.provider
        )
        return {"image": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/video")
async def generate_video(request: VideoGenerateRequest):
    """AIで動画を生成"""
    try:
        result = await media_service.generate_video(
            request.prompt,
            request.duration,
            request.resolution,
            request.style
        )
        return {"video": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/audio-clip")
async def generate_audio_clip(request: AudioClipGenerateRequest):
    """AIで音声クリップを生成"""
    try:
        result = await media_service.generate_audio_clip(
            request.text,
            request.voice,
            request.format,
            request.background_music
        )
        return {"audio_clip": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/video-clip")
async def generate_video_clip(request: VideoClipGenerateRequest):
    """AIで動画クリップを生成"""
    try:
        result = await media_service.generate_video_clip(
            request.script,
            request.duration,
            request.aspect_ratio,
            request.include_subtitles
        )
        return {"video_clip": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/styles/image")
async def get_image_styles():
    """画像スタイル一覧を取得"""
    try:
        styles = await media_service.get_image_styles()
        return {"styles": styles}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/styles/video")
async def get_video_styles():
    """動画スタイル一覧を取得"""
    try:
        styles = await media_service.get_video_styles()
        return {"styles": styles}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/voices")
async def get_voice_options():
    """音声オプション一覧を取得"""
    try:
        voices = await media_service.get_voice_options()
        return {"voices": voices}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/history/{media_type}")
async def get_generation_history(media_type: str):
    """生成履歴を取得"""
    try:
        if media_type not in ["image", "video", "audio"]:
            raise HTTPException(status_code=400, detail="Invalid media type")
        
        history = await media_service.get_generation_history(media_type)
        return {"history": history}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    """メディアファイルをアップロード"""
    try:
        # 実際の実装ではファイルを保存してURLを返す
        content = await file.read()
        
        # ファイルタイプを検証
        allowed_types = {
            "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
            "video": ["video/mp4", "video/avi", "video/quicktime", "video/webm"],
            "audio": ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac"]
        }
        
        media_type = None
        for type_name, mime_types in allowed_types.items():
            if file.content_type in mime_types:
                media_type = type_name
                break
        
        if not media_type:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        return {
            "filename": file.filename,
            "size": len(content),
            "type": media_type,
            "content_type": file.content_type,
            "url": f"/uploads/{file.filename}"  # 実際の実装では保存されたURL
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/templates")
async def get_media_templates():
    """メディア生成テンプレート一覧を取得"""
    try:
        templates = [
            {
                "id": "social_media_post",
                "name": "SNS投稿用画像",
                "type": "image",
                "description": "SNS投稿に最適な画像を生成",
                "default_size": "1080x1080",
                "default_style": "vibrant"
            },
            {
                "id": "youtube_thumbnail",
                "name": "YouTubeサムネイル",
                "type": "image",
                "description": "YouTube動画用のサムネイルを生成",
                "default_size": "1280x720",
                "default_style": "eye_catching"
            },
            {
                "id": "presentation_slide",
                "name": "プレゼンスライド",
                "type": "image",
                "description": "プレゼンテーション用のスライド画像を生成",
                "default_size": "1920x1080",
                "default_style": "professional"
            },
            {
                "id": "short_promo_video",
                "name": "短尺プロモ動画",
                "type": "video",
                "description": "SNS用の短尺プロモーション動画を生成",
                "default_duration": 15,
                "default_resolution": "1080p"
            },
            {
                "id": "explainer_video",
                "name": "解説動画",
                "type": "video",
                "description": "製品やサービスの解説動画を生成",
                "default_duration": 60,
                "default_resolution": "720p"
            },
            {
                "id": "podcast_intro",
                "name": "ポッドキャストイントロ",
                "type": "audio",
                "description": "ポッドキャスト用のイントロ音声を生成",
                "default_voice": "professional",
                "default_duration": 30
            },
            {
                "id": "narration",
                "name": "ナレーション",
                "type": "audio",
                "description": "ビデオ用のナレーション音声を生成",
                "default_voice": "natural",
                "include_background_music": True
            }
        ]
        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate/from-template")
async def generate_from_template(
    template_id: str,
    customizations: Optional[Dict[str, Any]] = None
):
    """テンプレートからメディアを生成"""
    try:
        # テンプレート情報を取得
        templates_response = await get_media_templates()
        templates = templates_response["templates"]
        
        template = next((t for t in templates if t["id"] == template_id), None)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # テンプレートタイプに応じて生成
        if template["type"] == "image":
            request = ImageGenerateRequest(
                prompt=customizations.get("prompt", "Beautiful image"),
                style=customizations.get("style", template.get("default_style", "realistic")),
                size=customizations.get("size", template.get("default_size", "1024x1024"))
            )
            result = await generate_image(request)
            
        elif template["type"] == "video":
            request = VideoGenerateRequest(
                prompt=customizations.get("prompt", "Amazing video"),
                duration=customizations.get("duration", template.get("default_duration", 10)),
                resolution=customizations.get("resolution", template.get("default_resolution", "720p"))
            )
            result = await generate_video(request)
            
        elif template["type"] == "audio":
            request = AudioClipGenerateRequest(
                text=customizations.get("text", "Welcome to our show"),
                voice=customizations.get("voice", template.get("default_voice", "natural")),
                background_music=customizations.get("background_music", template.get("include_background_music", False))
            )
            result = await generate_audio_clip(request)
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported template type")
        
        return {"media": result, "template": template}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

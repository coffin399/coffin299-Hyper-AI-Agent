from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

from ...services.line_service import line_service

router = APIRouter(prefix="/line", tags=["line"])


class SendMessageRequest(BaseModel):
    to: str = Field(..., description="送信先ID（ユーザーIDまたはグループID）")
    message_type: str = Field(default="text", description="メッセージタイプ")
    text: Optional[str] = Field(None, description="テキストメッセージ")
    image_url: Optional[str] = Field(None, description="画像URL")
    video_url: Optional[str] = Field(None, description="動画URL")
    audio_url: Optional[str] = Field(None, description="音声URL")


class FlexMessageRequest(BaseModel):
    to: str = Field(..., description="送信先ID")
    alt_text: str = Field(..., description="代替テキスト")
    contents: Dict[str, Any] = Field(..., description="Flexコンテンツ")


class BroadcastMessageRequest(BaseModel):
    message_type: str = Field(default="text", description="メッセージタイプ")
    text: Optional[str] = Field(None, description="テキストメッセージ")
    image_url: Optional[str] = Field(None, description="画像URL")


class RichMenuRequest(BaseModel):
    size: Dict[str, int] = Field(..., description="サイズ")
    selected: bool = Field(default=False, description="選択状態")
    name: str = Field(..., description="リッチメニュー名")
    chatBarText: str = Field(..., description="チャットバーのテキスト")
    areas: List[Dict[str, Any]] = Field(..., description="エリア")


@router.get("/webhook-url")
async def get_webhook_url():
    """LINE Webhook URLを取得"""
    try:
        webhook_url = await line_service.get_webhook_url()
        return {"webhook_url": webhook_url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-message")
async def send_message(request: SendMessageRequest):
    """LINEメッセージを送信"""
    try:
        message = await line_service.send_message(
            request.to,
            request.message_type,
            request.text,
            request.image_url,
            request.video_url,
            request.audio_url
        )
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-flex")
async def send_flex_message(request: FlexMessageRequest):
    """Flexメッセージを送信"""
    try:
        message = await line_service.send_flex_message(
            request.to,
            request.alt_text,
            request.contents
        )
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/broadcast")
async def broadcast_message(request: BroadcastMessageRequest):
    """ブロードキャストメッセージを送信"""
    try:
        result = await line_service.broadcast_message(
            request.message_type,
            request.text,
            request.image_url
        )
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/user/{user_id}/profile")
async def get_user_profile(user_id: str):
    """ユーザープロフィールを取得"""
    try:
        profile = await line_service.get_user_profile(user_id)
        return {"profile": profile}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/group/{group_id}/summary")
async def get_group_summary(group_id: str):
    """グループ情報を取得"""
    try:
        summary = await line_service.get_group_summary(group_id)
        return {"summary": summary}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/group/{group_id}/members")
async def get_group_members(group_id: str):
    """グループメンバー一覧を取得"""
    try:
        members = await line_service.get_group_members(group_id)
        return {"members": members}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/group/{group_id}/leave")
async def leave_group(group_id: str):
    """グループを退出"""
    try:
        success = await line_service.leave_group(group_id)
        return {"success": success}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/rich-menu")
async def create_rich_menu(request: RichMenuRequest):
    """リッチメニューを作成"""
    try:
        rich_menu = await line_service.create_rich_menu(
            request.size,
            request.selected,
            request.name,
            request.chatBarText,
            request.areas
        )
        return {"rich_menu": rich_menu}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/rich-menu/{rich_menu_id}/image")
async def set_rich_menu_image(rich_menu_id: str, request: Request):
    """リッチメニュー画像を設定"""
    try:
        # 実際の実装ではリクエストから画像データを取得
        image_data = b"mock_image_data"
        success = await line_service.set_rich_menu_image(rich_menu_id, image_data)
        return {"success": success}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/user/{user_id}/rich-menu/{rich_menu_id}")
async def link_rich_menu(user_id: str, rich_menu_id: str):
    """ユーザーにリッチメニューを紐付け"""
    try:
        success = await line_service.link_rich_menu(user_id, rich_menu_id)
        return {"success": success}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/friends")
async def get_friends_list():
    """友達一覧を取得"""
    try:
        friends = await line_service.get_friends_list()
        return {"friends": friends}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/groups")
async def get_groups_list():
    """グループ一覧を取得"""
    try:
        groups = await line_service.get_groups_list()
        return {"groups": groups}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-ai-summary")
async def send_ai_summary_to_line(
    to: str,
    title: str,
    summary: str,
    key_points: List[str],
    use_flex: bool = True
):
    """AI要約をLINEに送信"""
    try:
        if use_flex:
            # Flexメッセージを作成
            flex_contents = await line_service.create_ai_summary_flex(
                title,
                summary,
                key_points,
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            )
            
            message = await line_service.send_flex_message(
                to,
                f"🤖 AI要約: {title}",
                flex_contents
            )
        else:
            # テキストメッセージで送信
            text = f"🤖 AI要約\n\n{title}\n\n{summary}\n\n主要なポイント:\n"
            for point in key_points[:5]:
                text += f"• {point}\n"
            
            message = await line_service.send_message(to, "text", text)
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-meeting-minutes")
async def send_meeting_minutes_to_line(
    to: str,
    meeting_data: Dict[str, Any],
    use_flex: bool = True
):
    """会議議事録をLINEに送信"""
    try:
        if use_flex:
            # Flexメッセージを作成
            flex_contents = await line_service.create_meeting_minutes_flex(meeting_data)
            
            message = await line_service.send_flex_message(
                to,
                f"📋 会議議事録: {meeting_data.get('title', '会議議事録')}",
                flex_contents
            )
        else:
            # テキストメッセージで送信
            text = f"📋 会議議事録\n\n{meeting_data.get('title', '会議議事録')}\n\n"
            text += f"概要: {meeting_data.get('overview', '')}\n\n"
            
            if meeting_data.get('key_points'):
                text += "主要なポイント:\n"
                for point in meeting_data['key_points'][:5]:
                    text += f"• {point}\n"
                text += "\n"
            
            if meeting_data.get('action_items'):
                text += "アクションアイテム:\n"
                for item in meeting_data['action_items'][:3]:
                    text += f"• {item.get('description', '')} (担当: {item.get('assignee', '')})\n"
            
            message = await line_service.send_message(to, "text", text)
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-media-result")
async def send_media_result_to_line(
    to: str,
    media_type: str,
    media_url: str,
    prompt: str,
    title: Optional[str] = None
):
    """メディア生成結果をLINEに送信"""
    try:
        # タイプに応じてメッセージを作成
        titles = {
            "image": "🎨 AI画像生成",
            "video": "🎬 AI動画生成", 
            "audio": "🎤 AI音声生成",
            "clip": "🎞️ AIクリップ生成"
        }
        
        message_title = title or titles.get(media_type, "🤖 AIメディア生成")
        
        if media_type == "image":
            # 画像メッセージで送信
            message = await line_service.send_message(
                to,
                "image",
                text=f"{message_title}\n\nプロンプト: {prompt}",
                image_url=media_url
            )
        elif media_type == "video":
            # 動画メッセージで送信
            message = await line_service.send_message(
                to,
                "video",
                text=f"{message_title}\n\nプロンプト: {prompt}",
                video_url=media_url
            )
        elif media_type == "audio":
            # 音声メッセージで送信
            message = await line_service.send_message(
                to,
                "audio",
                text=f"{message_title}\n\nプロンプト: {prompt}",
                audio_url=media_url
            )
        else:
            # テキストメッセージで送信
            message = await line_service.send_message(
                to,
                "text",
                text=f"{message_title}\n\nプロンプト: {prompt}\n\nURL: {media_url}"
            )
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/webhook")
async def webhook_handler(request: Request):
    """LINE Webhookハンドラー"""
    try:
        # 実際の実装では署名検証とイベント処理
        body = await request.json()
        
        events = body.get("events", [])
        for event in events:
            if event["type"] == "message":
                # メッセージイベントを処理
                message_type = event["message"]["type"]
                if message_type == "text":
                    text = event["message"]["text"]
                    user_id = event["source"]["userId"]
                    
                    # AI応答を生成（モック）
                    if text.startswith("!ai"):
                        response_text = "AIアシスタントです。何かお手伝いできることはありますか？"
                        await line_service.send_message(user_id, "text", response_text)
        
        return {"status": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status")
async def get_connection_status():
    """接続ステータスを取得"""
    try:
        is_connected = line_service.is_connected()
        return {
            "connected": is_connected,
            "message": "Connected to LINE" if is_connected else "Not connected to LINE"
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/quick-reply")
async def send_quick_reply_message(
    to: str,
    text: str,
    quick_reply_items: List[Dict[str, Any]]
):
    """クイックリプライ付きメッセージを送信"""
    try:
        quick_reply = {
            "items": quick_reply_items
        }
        
        message = await line_service.send_message(
            to,
            "text",
            text,
            quick_reply=quick_reply
        )
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

from ...services.discord_service import discord_service

router = APIRouter(prefix="/discord", tags=["discord"])


class OAuthCallbackRequest(BaseModel):
    code: str = Field(..., description="OAuth認証コード")


class SendMessageRequest(BaseModel):
    channel_id: str = Field(..., description="チャンネルID")
    content: str = Field(..., description="メッセージ内容")
    embeds: Optional[List[Dict[str, Any]]] = Field(None, description="埋め込みメッセージ")
    attachments: Optional[List[str]] = Field(None, description="添付ファイル")


class WebhookMessageRequest(BaseModel):
    webhook_url: str = Field(..., description="Webhook URL")
    content: str = Field(..., description="メッセージ内容")
    username: Optional[str] = Field(None, description="送信者名")
    avatar_url: Optional[str] = Field(None, description="アバターURL")
    embeds: Optional[List[Dict[str, Any]]] = Field(None, description="埋め込みメッセージ")


class CreateWebhookRequest(BaseModel):
    channel_id: str = Field(..., description="チャンネルID")
    name: str = Field(..., description="Webhook名")
    avatar: Optional[str] = Field(None, description="アバター")


class CreateEmbedRequest(BaseModel):
    title: str = Field(..., description="タイトル")
    description: str = Field(..., description="説明")
    color: int = Field(default=0x00ff00, description="色")
    fields: Optional[List[Dict[str, Any]]] = Field(None, description="フィールド")
    footer: Optional[Dict[str, str]] = Field(None, description="フッター")


@router.get("/oauth-url")
async def get_oauth_url():
    """Discord OAuth認証URLを取得"""
    try:
        oauth_url = await discord_service.get_oauth_url()
        return {"oauth_url": oauth_url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/oauth/callback")
async def oauth_callback(request: OAuthCallbackRequest):
    """OAuthコールバック処理"""
    try:
        token_data = await discord_service.exchange_code_for_token(request.code)
        user_info = await discord_service.get_user_info(token_data["access_token"])
        
        return {
            "token": token_data,
            "user": user_info,
            "message": "Authentication successful"
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/user/{access_token}")
async def get_user_info(access_token: str):
    """ユーザー情報を取得"""
    try:
        user_info = await discord_service.get_user_info(access_token)
        return {"user": user_info}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/guilds/{access_token}")
async def get_user_guilds(access_token: str):
    """ユーザーが参加しているサーバー一覧を取得"""
    try:
        guilds = await discord_service.get_user_guilds(access_token)
        return {"guilds": guilds}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/guilds/{guild_id}/channels")
async def get_guild_channels(guild_id: str):
    """サーバーのチャンネル一覧を取得"""
    try:
        channels = await discord_service.get_guild_channels(guild_id)
        return {"channels": channels}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-message")
async def send_message(request: SendMessageRequest):
    """Discordチャンネルにメッセージを送信"""
    try:
        message = await discord_service.send_message(
            request.channel_id,
            request.content,
            request.embeds,
            request.attachments
        )
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/channels/{channel_id}/messages")
async def get_channel_messages(
    channel_id: str,
    limit: int = 50,
    before: Optional[str] = None
):
    """チャンネルのメッセージ履歴を取得"""
    try:
        if limit < 1 or limit > 100:
            raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
        
        messages = await discord_service.get_channel_messages(
            channel_id,
            limit,
            before
        )
        return {"messages": messages}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/create-webhook")
async def create_webhook(request: CreateWebhookRequest):
    """Webhookを作成"""
    try:
        webhook = await discord_service.create_webhook(
            request.channel_id,
            request.name,
            request.avatar
        )
        return {"webhook": webhook}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-webhook")
async def send_webhook_message(request: WebhookMessageRequest):
    """Webhook経由でメッセージを送信"""
    try:
        message = await discord_service.send_webhook_message(
            request.webhook_url,
            request.content,
            request.username,
            request.avatar_url,
            request.embeds
        )
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bot-info")
async def get_bot_info():
    """Bot情報を取得"""
    try:
        bot_info = await discord_service.get_bot_info()
        return {"bot": bot_info}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/create-embed")
async def create_embed(request: CreateEmbedRequest):
    """埋め込みメッセージを作成"""
    try:
        embed = await discord_service.create_embed(
            request.title,
            request.description,
            request.color,
            request.fields,
            request.footer
        )
        return {"embed": embed}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/revoke/{access_token}")
async def revoke_token(access_token: str):
    """アクセストークンを失効"""
    try:
        success = await discord_service.revoke_token(access_token)
        return {"success": success}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status")
async def get_connection_status():
    """接続ステータスを取得"""
    try:
        is_connected = discord_service.is_connected()
        return {
            "connected": is_connected,
            "message": "Connected to Discord" if is_connected else "Not connected to Discord"
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-ai-summary")
async def send_ai_summary_to_discord(
    channel_id: str,
    summary_text: str,
    title: str = "AI要約",
    include_timestamp: bool = True
):
    """AI要約をDiscordに送信"""
    try:
        # 埋め込みメッセージを作成
        embed = await discord_service.create_embed(
            title=title,
            description=summary_text[:2000],  # Discordの文字数制限
            color=0x0099ff
        )
        
        if include_timestamp:
            embed["footer"] = {"text": f"Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
        
        message = await discord_service.send_message(
            channel_id,
            f"🤖 {title}",
            [embed]
        )
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-meeting-minutes")
async def send_meeting_minutes_to_discord(
    channel_id: str,
    meeting_data: Dict[str, Any]
):
    """会議議事録をDiscordに送信"""
    try:
        # 埋め込みメッセージを作成
        embed = await discord_service.create_embed(
            title=f"📋 {meeting_data.get('title', '会議議事録')}",
            description=meeting_data.get('overview', ''),
            color=0x00ff00
        )
        
        # 主要なポイントをフィールドとして追加
        if meeting_data.get('key_points'):
            key_points_text = '\n'.join([f"• {point}" for point in meeting_data['key_points'][:5]])
            embed["fields"] = [
                {
                    "name": "主要なポイント",
                    "value": key_points_text,
                    "inline": False
                }
            ]
        
        # アクションアイテムを追加
        if meeting_data.get('action_items'):
            action_text = '\n'.join([
                f"• {item.get('description', '')} (担当: {item.get('assignee', '')})"
                for item in meeting_data['action_items'][:3]
            ])
            embed["fields"].append({
                "name": "アクションアイテム",
                "value": action_text,
                "inline": False
            })
        
        embed["footer"] = {"text": f"会議日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
        
        message = await discord_service.send_message(
            channel_id,
            "📝 会議議事録が作成されました",
            [embed]
        )
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-media-result")
async def send_media_result_to_discord(
    channel_id: str,
    media_type: str,
    media_url: str,
    prompt: str,
    title: Optional[str] = None
):
    """メディア生成結果をDiscordに送信"""
    try:
        # タイプに応じて色を変更
        colors = {
            "image": 0xff6b6b,
            "video": 0x4ecdc4,
            "audio": 0x45b7d1,
            "clip": 0x96ceb4
        }
        
        color = colors.get(media_type, 0x95a5a6)
        
        # タイトルを生成
        titles = {
            "image": "🎨 AI画像生成",
            "video": "🎬 AI動画生成", 
            "audio": "🎤 AI音声生成",
            "clip": "🎞️ AIクリップ生成"
        }
        
        embed_title = title or titles.get(media_type, "🤖 AIメディア生成")
        
        # 埋め込みメッセージを作成
        embed = await discord_service.create_embed(
            title=embed_title,
            description=f"**プロンプト:** {prompt}",
            color=color
        )
        
        embed["image"] = {"url": media_url} if media_type in ["image", "video"] else None
        embed["footer"] = {"text": f"Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
        
        message = await discord_service.send_message(
            channel_id,
            f"✨ {embed_title}",
            [embed]
        )
        
        return {"message": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

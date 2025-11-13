from __future__ import annotations

import logging
import json
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class LineService:
    """LINE連携サービス"""

    def __init__(self) -> None:
        self.channel_access_token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
        self.channel_secret = os.getenv("LINE_CHANNEL_SECRET")
        self.webhook_url = os.getenv("LINE_WEBHOOK_URL")
        
        # モックデータ（実際の実装ではLINE APIから取得）
        self.mock_friends = [
            {
                "user_id": "U1234567890abcdef1234567890abcdef",
                "display_name": "田中 太郎",
                "picture_url": "https://profile.line-scdn.net/abcdefghijklmn",
                "status_message": "AI開発しています"
            },
            {
                "user_id": "Uabcdef1234567890abcdef1234567890",
                "display_name": "鈴木 花子",
                "picture_url": "https://profile.line-scdn.net/qrstuvwxyzabcdef",
                "status_message": "よろしくお願いします"
            }
        ]
        
        self.mock_groups = [
            {
                "group_id": "C1234567890abcdef1234567890abcdef",
                "group_name": "AI開発チーム",
                "picture_url": "https://profile.line-scdn.net/group/abcdefghijklmn",
                "member_count": 25
            },
            {
                "group_id": "Cabcdef1234567890abcdef1234567890",
                "group_name": "プロジェクト議論",
                "picture_url": None,
                "member_count": 15
            }
        ]

    async def get_webhook_url(self) -> str:
        """LINE Webhook URLを取得"""
        try:
            if not self.webhook_url:
                # 実際の実装ではLINE Developersコンソールから取得
                webhook_url = f"https://your-domain.com/api/line/webhook"
                return webhook_url
            return self.webhook_url
        except Exception as e:
            logger.error(f"Failed to get webhook URL: {e}")
            raise

    async def send_message(
        self,
        to: str,
        message_type: str = "text",
        text: Optional[str] = None,
        image_url: Optional[str] = None,
        video_url: Optional[str] = None,
        audio_url: Optional[str] = None,
        quick_reply: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """LINEメッセージを送信"""
        try:
            # 実際の実装ではLINE Messaging APIで送信
            await asyncio.sleep(1)  # 擬似的な処理時間
            
            message_content = {
                "type": message_type
            }
            
            if text:
                message_content["text"] = text
            if image_url:
                message_content["originalContentUrl"] = image_url
                message_content["previewImageUrl"] = image_url
            if video_url:
                message_content["originalContentUrl"] = video_url
                message_content["previewImageUrl"] = video_url
            if quick_reply:
                message_content["quickReply"] = quick_reply
            
            mock_response = {
                "message_id": f"msg_{int(datetime.now().timestamp() * 1000)}",
                "to": to,
                "message": message_content,
                "status": "sent",
                "timestamp": datetime.now().isoformat()
            }
            
            return mock_response
        except Exception as e:
            logger.error(f"Failed to send LINE message: {e}")
            raise

    async def send_flex_message(
        self,
        to: str,
        alt_text: str,
        contents: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Flexメッセージを送信"""
        try:
            # 実際の実装ではLINE Messaging APIでFlexメッセージ送信
            await asyncio.sleep(1)
            
            mock_response = {
                "message_id": f"flex_{int(datetime.now().timestamp() * 1000)}",
                "to": to,
                "altText": alt_text,
                "contents": contents,
                "status": "sent",
                "timestamp": datetime.now().isoformat()
            }
            
            return mock_response
        except Exception as e:
            logger.error(f"Failed to send Flex message: {e}")
            raise

    async def broadcast_message(
        self,
        message_type: str = "text",
        text: Optional[str] = None,
        image_url: Optional[str] = None,
        quick_reply: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """ブロードキャストメッセージを送信"""
        try:
            # 実際の実装ではLINE Messaging APIでブロードキャスト
            await asyncio.sleep(2)  # ブロードキャストは時間がかかる
            
            mock_response = {
                "request_id": f"broadcast_{int(datetime.now().timestamp() * 1000)}",
                "message_type": message_type,
                "message": text or "Broadcast message",
                "status": "sent",
                "timestamp": datetime.now().isoformat(),
                "recipients": len(self.mock_friends) + sum(g["member_count"] for g in self.mock_groups)
            }
            
            return mock_response
        except Exception as e:
            logger.error(f"Failed to broadcast message: {e}")
            raise

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """ユーザープロフィールを取得"""
        try:
            # 実際の実装ではLINE APIから取得
            await asyncio.sleep(0.5)
            
            user = next((f for f in self.mock_friends if f["user_id"] == user_id), None)
            if not user:
                raise ValueError("User not found")
            
            return {
                "userId": user["user_id"],
                "displayName": user["display_name"],
                "pictureUrl": user["picture_url"],
                "statusMessage": user["status_message"]
            }
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            raise

    async def get_group_summary(self, group_id: str) -> Dict[str, Any]:
        """グループ情報を取得"""
        try:
            # 実際の実装ではLINE APIから取得
            await asyncio.sleep(0.5)
            
            group = next((g for g in self.mock_groups if g["group_id"] == group_id), None)
            if not group:
                raise ValueError("Group not found")
            
            return {
                "groupId": group["group_id"],
                "groupName": group["group_name"],
                "pictureUrl": group["picture_url"],
                "memberCount": group["member_count"]
            }
        except Exception as e:
            logger.error(f"Failed to get group summary: {e}")
            raise

    async def get_group_members(self, group_id: str) -> List[Dict[str, Any]]:
        """グループメンバー一覧を取得"""
        try:
            # 実際の実装ではLINE APIから取得
            await asyncio.sleep(1)
            
            # モックメンバー
            mock_members = [
                {
                    "userId": "U1234567890abcdef1234567890abcdef",
                    "displayName": "田中 太郎",
                    "pictureUrl": "https://profile.line-scdn.net/abcdefghijklmn"
                },
                {
                    "userId": "Uabcdef1234567890abcdef1234567890",
                    "displayName": "鈴木 花子",
                    "pictureUrl": "https://profile.line-scdn.net/qrstuvwxyzabcdef"
                }
            ]
            
            return mock_members
        except Exception as e:
            logger.error(f"Failed to get group members: {e}")
            raise

    async def leave_group(self, group_id: str) -> bool:
        """グループを退出"""
        try:
            # 実際の実装ではLINE APIで退出
            await asyncio.sleep(0.5)
            return True
        except Exception as e:
            logger.error(f"Failed to leave group: {e}")
            return False

    async def create_rich_menu(
        self,
        size: Dict[str, int],
        selected: bool,
        name: str,
        chatBarText: str,
        areas: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """リッチメニューを作成"""
        try:
            # 実際の実装ではLINE APIでリッチメニュー作成
            await asyncio.sleep(1)
            
            mock_rich_menu = {
                "richMenuId": f"richmenu_{int(datetime.now().timestamp() * 1000)}",
                "size": size,
                "selected": selected,
                "name": name,
                "chatBarText": chatBarText,
                "areas": areas,
                "status": "created"
            }
            
            return mock_rich_menu
        except Exception as e:
            logger.error(f"Failed to create rich menu: {e}")
            raise

    async def set_rich_menu_image(self, rich_menu_id: str, image_data: bytes) -> bool:
        """リッチメニュー画像を設定"""
        try:
            # 実際の実装ではLINE APIで画像設定
            await asyncio.sleep(1)
            return True
        except Exception as e:
            logger.error(f"Failed to set rich menu image: {e}")
            return False

    async def link_rich_menu(self, user_id: str, rich_menu_id: str) -> bool:
        """ユーザーにリッチメニューを紐付け"""
        try:
            # 実際の実装ではLINE APIで紐付け
            await asyncio.sleep(0.5)
            return True
        except Exception as e:
            logger.error(f"Failed to link rich menu: {e}")
            return False

    async def get_friends_list(self) -> List[Dict[str, Any]]:
        """友達一覧を取得"""
        try:
            # 実際の実装ではLINE APIから取得
            await asyncio.sleep(1)
            return self.mock_friends
        except Exception as e:
            logger.error(f"Failed to get friends list: {e}")
            raise

    async def get_groups_list(self) -> List[Dict[str, Any]]:
        """グループ一覧を取得"""
        try:
            # 実際の実装ではLINE APIから取得
            await asyncio.sleep(1)
            return self.mock_groups
        except Exception as e:
            logger.error(f"Failed to get groups list: {e}")
            raise

    async def create_ai_summary_flex(
        self,
        title: str,
        summary: str,
        key_points: List[str],
        timestamp: str
    ) -> Dict[str, Any]:
        """AI要約用のFlexメッセージを作成"""
        try:
            flex_contents = {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "🤖 AI要約",
                            "weight": "bold",
                            "size": "xl",
                            "color": "#ffffff"
                        }
                    ],
                    "backgroundColor": "#00C300"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": title,
                            "weight": "bold",
                            "size": "lg",
                            "margin": "md"
                        },
                        {
                            "type": "text",
                            "text": summary,
                            "wrap": True,
                            "margin": "md",
                            "size": "sm"
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "margin": "lg",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "主要なポイント",
                                    "weight": "bold",
                                    "size": "sm",
                                    "color": "#888888"
                                }
                            ]
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "button",
                            "style": "primary",
                            "height": "sm",
                            "action": {
                                "type": "uri",
                                "label": "詳細を見る",
                                "uri": "https://your-domain.com/summary"
                            }
                        },
                        {
                            "type": "text",
                            "text": timestamp,
                            "size": "xs",
                            "color": "#888888",
                            "align": "center",
                            "margin": "md"
                        }
                    ]
                }
            }
            
            # 主要なポイントを追加
            for i, point in enumerate(key_points[:3]):  # 最大3つ
                flex_contents["body"]["contents"].append({
                    "type": "text",
                    "text": f"• {point}",
                    "wrap": True,
                    "size": "xs",
                    "margin": "sm"
                })
            
            return flex_contents
        except Exception as e:
            logger.error(f"Failed to create AI summary flex: {e}")
            raise

    async def create_meeting_minutes_flex(
        self,
        meeting_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """会議議事録用のFlexメッセージを作成"""
        try:
            flex_contents = {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "📋 会議議事録",
                            "weight": "bold",
                            "size": "xl",
                            "color": "#ffffff"
                        }
                    ],
                    "backgroundColor": "#1D74F5"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": meeting_data.get("title", "会議議事録"),
                            "weight": "bold",
                            "size": "lg",
                            "margin": "md"
                        },
                        {
                            "type": "text",
                            "text": meeting_data.get("overview", ""),
                            "wrap": True,
                            "margin": "md",
                            "size": "sm"
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "button",
                            "style": "primary",
                            "height": "sm",
                            "action": {
                                "type": "uri",
                                "label": "議事録を開く",
                                "uri": "https://your-domain.com/minutes"
                            }
                        },
                        {
                            "type": "text",
                            "text": f"参加者: {len(meeting_data.get('participants', []))}人",
                            "size": "xs",
                            "color": "#888888",
                            "align": "center",
                            "margin": "md"
                        }
                    ]
                }
            }
            
            # アクションアイテムを追加
            if meeting_data.get("action_items"):
                flex_contents["body"]["contents"].append({
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [
                        {
                            "type": "text",
                            "text": "アクションアイテム",
                            "weight": "bold",
                            "size": "sm",
                            "color": "#888888"
                        }
                    ]
                })
                
                for item in meeting_data["action_items"][:2]:  # 最大2つ
                    flex_contents["body"]["contents"].append({
                        "type": "text",
                        "text": f"• {item.get('description', '')}",
                        "wrap": True,
                        "size": "xs",
                        "margin": "sm"
                    })
            
            return flex_contents
        except Exception as e:
            logger.error(f"Failed to create meeting minutes flex: {e}")
            raise

    def is_connected(self) -> bool:
        """LINEに接続されているか確認"""
        return bool(self.channel_access_token and self.channel_secret)


line_service = LineService()

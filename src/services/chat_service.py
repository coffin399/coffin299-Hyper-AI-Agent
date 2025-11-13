from __future__ import annotations

import logging
import json
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class ChatMessage:
    """チャットメッセージ"""
    
    def __init__(
        self,
        role: str,
        content: str,
        message_id: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = message_id or str(uuid.uuid4())
        self.role = role  # 'user', 'assistant', 'system'
        self.content = content
        self.timestamp = timestamp or datetime.now()
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }


class ChatSession:
    """チャットセッション"""
    
    def __init__(
        self,
        session_id: Optional[str] = None,
        title: Optional[str] = None,
        model: str = "gpt-3.5-turbo",
        system_prompt: Optional[str] = None
    ):
        self.id = session_id or str(uuid.uuid4())
        self.title = title or "新しいチャット"
        self.model = model
        self.system_prompt = system_prompt or "あなたは役立つAIアシスタントです。"
        self.messages: List[ChatMessage] = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def add_message(self, message: ChatMessage) -> None:
        """メッセージを追加"""
        self.messages.append(message)
        self.updated_at = datetime.now()

    def get_messages(self) -> List[Dict[str, Any]]:
        """メッセージ履歴を取得"""
        return [msg.to_dict() for msg in self.messages]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "model": self.model,
            "system_prompt": self.system_prompt,
            "messages": self.get_messages(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class ChatService:
    """AIチャットサービス"""

    def __init__(self) -> None:
        self.sessions: Dict[str, ChatSession] = {}
        self.available_models = [
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "高速でコスト効率の良いモデル"},
            {"id": "gpt-4", "name": "GPT-4", "description": "高性能で高精度なモデル"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "description": "最新の高性能モデル"},
            {"id": "claude-3-sonnet", "name": "Claude 3 Sonnet", "description": "バランスの取れたモデル"},
            {"id": "claude-3-opus", "name": "Claude 3 Opus", "description": "最高性能のモデル"}
        ]

    async def create_session(
        self,
        title: Optional[str] = None,
        model: str = "gpt-3.5-turbo",
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """新しいチャットセッションを作成"""
        try:
            session = ChatSession(
                title=title,
                model=model,
                system_prompt=system_prompt
            )
            
            self.sessions[session.id] = session
            
            return {
                "session_id": session.id,
                "title": session.title,
                "model": session.model,
                "created_at": session.created_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to create chat session: {e}")
            raise

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """チャットセッションを取得"""
        session = self.sessions.get(session_id)
        return session.to_dict() if session else None

    async def get_sessions(self) -> List[Dict[str, Any]]:
        """全チャットセッションを取得"""
        return [session.to_dict() for session in self.sessions.values()]

    async def delete_session(self, session_id: str) -> bool:
        """チャットセッションを削除"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    async def send_message(
        self,
        session_id: str,
        message: str,
        role: str = "user"
    ) -> Dict[str, Any]:
        """メッセージを送信してAI応答を取得"""
        try:
            session = self.sessions.get(session_id)
            if not session:
                raise ValueError("Session not found")

            # ユーザーメッセージを追加
            user_message = ChatMessage(role=role, content=message)
            session.add_message(user_message)

            # AI応答を生成
            ai_response = await self._generate_ai_response(session)
            
            # アシスタントメッセージを追加
            assistant_message = ChatMessage(
                role="assistant",
                content=ai_response["content"],
                metadata=ai_response.get("metadata", {})
            )
            session.add_message(assistant_message)

            return {
                "message": assistant_message.to_dict(),
                "session_updated": session.updated_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise

    async def update_session(
        self,
        session_id: str,
        title: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> bool:
        """チャットセッションを更新"""
        session = self.sessions.get(session_id)
        if not session:
            return False

        if title is not None:
            session.title = title
        if system_prompt is not None:
            session.system_prompt = system_prompt

        session.updated_at = datetime.now()
        return True

    async def get_available_models(self) -> List[Dict[str, str]]:
        """利用可能なモデル一覧を取得"""
        return self.available_models

    async def export_session(self, session_id: str, format: str = "json") -> str:
        """チャットセッションをエクスポート"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        if format == "json":
            return json.dumps(session.to_dict(), ensure_ascii=False, indent=2)
        elif format == "markdown":
            return self._export_to_markdown(session)
        elif format == "txt":
            return self._export_to_text(session)
        else:
            raise ValueError("Unsupported export format")

    async def search_messages(
        self,
        session_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """メッセージを検索"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        # 簡単な検索実装（実際の実装ではベクトル検索などを使用）
        results = []
        query_lower = query.lower()
        
        for message in session.messages:
            if query_lower in message.content.lower():
                results.append(message.to_dict())
                if len(results) >= limit:
                    break
        
        return results

    async def _generate_ai_response(self, session: ChatSession) -> Dict[str, Any]:
        """AI応答を生成（モック実装）"""
        await asyncio.sleep(1)  # 擬似的な応答時間
        
        # 簡単な応答ロジック（実際の実装ではOpenAI APIなどを呼び出す）
        last_message = session.messages[-1].content if session.messages else ""
        
        responses = [
            "その点について詳しく教えていただけますか？",
            "興味深い質問ですね。もう少し背景を知りたいです。",
            "承知いたしました。どのようなサポートが必要でしょうか？",
            "素晴らしいアイデアですね！具体的な計画はありますか？",
            "理解しました。次のステップについて考えましょう。"
        ]
        
        import random
        response_text = random.choice(responses)
        
        # 最後のメッセージに応じてカスタマイズ
        if "こんにちは" in last_message:
            response_text = "こんにちは！今日はどのようなお手伝いをしましょうか？"
        elif "ありがとう" in last_message:
            response_text = "どういたしまして！また何かあればお気軽にご質問ください。"
        elif "さようなら" in last_message:
            response_text = "さようなら！またのご利用をお待ちしております。"
        
        return {
            "content": response_text,
            "metadata": {
                "model": session.model,
                "tokens_used": 150,
                "response_time": 1.0
            }
        }

    def _export_to_markdown(self, session: ChatSession) -> str:
        """Markdown形式でエクスポート"""
        lines = [
            f"# {session.title}",
            f"",
            f"**モデル:** {session.model}",
            f"**作成日時:** {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**更新日時:** {session.updated_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"",
            f"---",
            f""
        ]
        
        for message in session.messages:
            role_name = "ユーザー" if message.role == "user" else "アシスタント"
            lines.extend([
                f"## {role_name}",
                f"",
                f"{message.content}",
                f"",
                f"*{message.timestamp.strftime('%Y-%m-%d %H:%M:%S')}*",
                f"",
                f"---",
                f""
            ])
        
        return "\n".join(lines)

    def _export_to_text(self, session: ChatSession) -> str:
        """テキスト形式でエクスポート"""
        lines = [
            f"タイトル: {session.title}",
            f"モデル: {session.model}",
            f"作成日時: {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"",
            "=" * 50,
            f""
        ]
        
        for message in session.messages:
            role_name = "ユーザー" if message.role == "user" else "アシスタント"
            lines.extend([
                f"[{role_name}] {message.timestamp.strftime('%H:%M:%S')}",
                f"{message.content}",
                f"",
                "-" * 30,
                f""
            ])
        
        return "\n".join(lines)


chat_service = ChatService()

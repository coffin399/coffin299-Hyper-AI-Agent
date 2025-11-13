from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class RoleService:
    """AIロール管理サービス"""

    def __init__(self) -> None:
        self.roles = self._initialize_roles()

    def _initialize_roles(self) -> Dict[str, Any]:
        """AIロールを初期化"""
        return {
            "developer": {
                "id": "developer",
                "name": "AIデベロッパー",
                "description": "コード生成、デバッグ、技術相談をサポート",
                "icon": "code",
                "color": "#61DAFB",
                "capabilities": [
                    "コード生成",
                    "バグ修正",
                    "コードレビュー",
                    "技術ドキュメント作成",
                    "API設計",
                    "データベース設計"
                ],
                "system_prompt": """あなたは経験豊富なソフトウェア開発者です。
以下の専門知識を持っています：
- フロントエンド開発 (React, Vue, Angular)
- バックエンド開発 (Python, Node.js, Java)
- モバイル開発 (React Native, Flutter)
- データベース設計 (SQL, NoSQL)
- クラウド技術 (AWS, GCP, Azure)
- デベロップメントプラクティス (CI/CD, テスト, バージョン管理)

ユーザーの技術的な質問や課題に対して、実用的で具体的な解決策を提供してください。
コード例を示す際は、ベストプラクティスに従ったクリーンなコードを記述してください。""",
                "templates": [
                    {
                        "id": "code_generation",
                        "name": "コード生成",
                        "prompt": "以下の要件を満たす{language}コードを生成してください：{requirements}",
                        "variables": ["language", "requirements"]
                    },
                    {
                        "id": "bug_fix",
                        "name": "バグ修正",
                        "prompt": "以下のコードのバグを特定し修正してください：{code}\nエラー内容：{error}",
                        "variables": ["code", "error"]
                    },
                    {
                        "id": "code_review",
                        "name": "コードレビュー",
                        "prompt": "以下のコードをレビューし、改善点を指摘してください：{code}",
                        "variables": ["code"]
                    }
                ]
            },
            "designer": {
                "id": "designer",
                "name": "AIデザイナー",
                "description": "UI/UXデザイン、デザインシステム、ブランド戦略をサポート",
                "icon": "palette",
                "color": "#FF6B6B",
                "capabilities": [
                    "UIデザイン",
                    "UX改善提案",
                    "デザインシステム構築",
                    "ブランドガイドライン",
                    "ワイヤーフレーム作成",
                    "色彩・タイポグラフィ提案"
                ],
                "system_prompt": """あなたは経験豊富なUI/UXデザイナーです。
以下の専門知識を持っています：
- UIデザイン原則とベストプラクティス
- UXリサーチとユーザビリティテスト
- デザインシステム構築
- ブランドアイデンティティ設計
- レスポンシブデザイン
- アクセシビリティ対応
- 最新のデザインツールとトレンド

ユーザーのデザインに関する質問や課題に対して、ユーザー中心の視点から具体的な解決策を提供してください。
視覚的な説明が必要な場合は、詳細なテキストでデザインを描写してください。""",
                "templates": [
                    {
                        "id": "ui_design",
                        "name": "UIデザイン提案",
                        "prompt": "以下の要件に基づいてUIデザインを提案してください：{requirements}\n対象ユーザー：{users}",
                        "variables": ["requirements", "users"]
                    },
                    {
                        "id": "ux_improvement",
                        "name": "UX改善提案",
                        "prompt": "以下のUI/UXの改善点を提案してください：{current_design}\n課題：{issues}",
                        "variables": ["current_design", "issues"]
                    },
                    {
                        "id": "design_system",
                        "name": "デザインシステム",
                        "prompt": "以下のプロダクト向けのデザインシステムを設計してください：{product_info}",
                        "variables": ["product_info"]
                    }
                ]
            },
            "analyst": {
                "id": "analyst",
                "name": "AIアナリスト",
                "description": "データ分析、ビジネスインテリジェンス、市場分析をサポート",
                "icon": "analytics",
                "color": "#4CAF50",
                "capabilities": [
                    "データ分析",
                    "統計解析",
                    "ビジネスインテリジェンス",
                    "市場調査",
                    "KPI設計",
                    "レポート作成"
                ],
                "system_prompt": """あなたは経験豊富なデータアナリストです。
以下の専門知識を持っています：
- 統計解析とデータサイエンス
- ビジネスインテリジェンスとダッシュボード設計
- 市場調査と競合分析
- KPI設計とパフォーマンス測定
- データ可視化
- 機械学習の基礎知識

ユーザーのデータ分析やビジネス分析に関する質問に対して、データに基づいた客観的な洞察を提供してください。
分析結果を分かりやすく説明し、具体的なアクションプランを提案してください。""",
                "templates": [
                    {
                        "id": "data_analysis",
                        "name": "データ分析",
                        "prompt": "以下のデータを分析してください：{data}\n分析目的：{purpose}",
                        "variables": ["data", "purpose"]
                    },
                    {
                        "id": "kpi_design",
                        "name": "KPI設計",
                        "prompt": "以下の事業目標のためのKPIを設計してください：{business_goals}",
                        "variables": ["business_goals"]
                    },
                    {
                        "id": "market_research",
                        "name": "市場調査",
                        "prompt": "以下の市場について調査・分析してください：{market_info}",
                        "variables": ["market_info"]
                    }
                ]
            },
            "consultant": {
                "id": "consultant",
                "name": "AIコンサルタント",
                "description": "事業戦略、プロジェクト管理、組織改善をサポート",
                "icon": "business",
                "color": "#9C27B0",
                "capabilities": [
                    "事業戦略立案",
                    "プロジェクト管理",
                    "組織改善提案",
                    "プロセス最適化",
                    "リスク管理",
                    "コミュニケーション改善"
                ],
                "system_prompt": """あなたは経験豊富なビジネスコンサルタントです。
以下の専門知識を持っています：
- 事業戦略立案と実行支援
- プロジェクトマネジメント (PMP, Agile)
- 組織開発とチェンジマネジメント
- プロセス改善と最適化
- リスク管理と問題解決
- ステークホルダー管理

ユーザーのビジネス課題に対して、体系的なアプローチで具体的な解決策を提供してください。
短期的な対策と長期的な戦略の両方を考慮に入れた提案をしてください。""",
                "templates": [
                    {
                        "id": "business_strategy",
                        "name": "事業戦略",
                        "prompt": "以下の事業の戦略を立案してください：{business_info}\n目標：{goals}",
                        "variables": ["business_info", "goals"]
                    },
                    {
                        "id": "project_management",
                        "name": "プロジェクト管理",
                        "prompt": "以下のプロジェクトの管理計画を策定してください：{project_details}",
                        "variables": ["project_details"]
                    },
                    {
                        "id": "process_improvement",
                        "name": "プロセス改善",
                        "prompt": "以下の業務プロセスを改善してください：{current_process}\n課題：{issues}",
                        "variables": ["current_process", "issues"]
                    }
                ]
            }
        }

    async def get_roles(self) -> List[Dict[str, Any]]:
        """利用可能なAIロール一覧を取得"""
        return list(self.roles.values())

    async def get_role(self, role_id: str) -> Optional[Dict[str, Any]]:
        """特定のAIロール情報を取得"""
        return self.roles.get(role_id)

    async def get_role_templates(self, role_id: str) -> List[Dict[str, Any]]:
        """AIロールのテンプレート一覧を取得"""
        role = self.roles.get(role_id)
        return role.get("templates", []) if role else []

    async def get_role_capabilities(self, role_id: str) -> List[str]:
        """AIロールの能力一覧を取得"""
        role = self.roles.get(role_id)
        return role.get("capabilities", []) if role else []

    async def generate_prompt_with_role(
        self, 
        role_id: str, 
        template_id: str, 
        variables: Dict[str, str]
    ) -> str:
        """ロールとテンプレートからプロンプトを生成"""
        role = self.roles.get(role_id)
        if not role:
            raise ValueError(f"Role {role_id} not found")

        templates = {t["id"]: t for t in role["templates"]}
        template = templates.get(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")

        # テンプレートの変数を置換
        prompt = template["prompt"]
        for var_name, var_value in variables.items():
            prompt = prompt.replace(f"{{{var_name}}}", var_value)

        return prompt

    async def get_system_prompt(self, role_id: str) -> str:
        """AIロールのシステムプロンプトを取得"""
        role = self.roles.get(role_id)
        if not role:
            raise ValueError(f"Role {role_id} not found")
        
        return role.get("system_prompt", "")

    async def create_custom_role(
        self,
        name: str,
        description: str,
        system_prompt: str,
        capabilities: List[str],
        templates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """カスタムAIロールを作成"""
        role_id = f"custom_{len(self.roles)}"
        
        new_role = {
            "id": role_id,
            "name": name,
            "description": description,
            "icon": "custom",
            "color": "#607D8B",
            "capabilities": capabilities,
            "system_prompt": system_prompt,
            "templates": templates
        }
        
        self.roles[role_id] = new_role
        return new_role

    async def update_role(self, role_id: str, updates: Dict[str, Any]) -> bool:
        """AIロールを更新"""
        if role_id not in self.roles:
            return False
        
        self.roles[role_id].update(updates)
        return True

    async def delete_role(self, role_id: str) -> bool:
        """AIロールを削除"""
        if role_id.startswith("custom_") and role_id in self.roles:
            del self.roles[role_id]
            return True
        return False


role_service = RoleService()

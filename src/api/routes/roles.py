from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.role_service import role_service

router = APIRouter(prefix="/roles", tags=["roles"])


class CustomRoleCreateRequest(BaseModel):
    name: str = Field(..., description="ロール名")
    description: str = Field(..., description="ロール説明")
    system_prompt: str = Field(..., description="システムプロンプト")
    capabilities: List[str] = Field(..., description="能力リスト")
    templates: List[Dict[str, Any]] = Field(default_factory=list, description="テンプレートリスト")


class PromptGenerateRequest(BaseModel):
    role_id: str = Field(..., description="AIロールID")
    template_id: str = Field(..., description="テンプレートID")
    variables: Dict[str, str] = Field(..., description="テンプレート変数")


class RoleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    capabilities: Optional[List[str]] = None
    templates: Optional[List[Dict[str, Any]]] = None


@router.get("/")
async def get_roles():
    """AIロール一覧を取得"""
    try:
        roles = await role_service.get_roles()
        return {"roles": roles}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{role_id}")
async def get_role(role_id: str):
    """特定のAIロール情報を取得"""
    try:
        role = await role_service.get_role(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        return {"role": role}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{role_id}/templates")
async def get_role_templates(role_id: str):
    """AIロールのテンプレート一覧を取得"""
    try:
        templates = await role_service.get_role_templates(role_id)
        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{role_id}/capabilities")
async def get_role_capabilities(role_id: str):
    """AIロールの能力一覧を取得"""
    try:
        capabilities = await role_service.get_role_capabilities(role_id)
        return {"capabilities": capabilities}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{role_id}/system-prompt")
async def get_system_prompt(role_id: str):
    """AIロールのシステムプロンプトを取得"""
    try:
        prompt = await role_service.get_system_prompt(role_id)
        return {"system_prompt": prompt}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-prompt")
async def generate_prompt_with_role(request: PromptGenerateRequest):
    """ロールとテンプレートからプロンプトを生成"""
    try:
        prompt = await role_service.generate_prompt_with_role(
            request.role_id,
            request.template_id,
            request.variables
        )
        return {"prompt": prompt}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/custom")
async def create_custom_role(request: CustomRoleCreateRequest):
    """カスタムAIロールを作成"""
    try:
        role = await role_service.create_custom_role(
            request.name,
            request.description,
            request.system_prompt,
            request.capabilities,
            request.templates
        )
        return {"role": role}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{role_id}")
async def update_role(role_id: str, request: RoleUpdateRequest):
    """AIロールを更新"""
    try:
        updates = {k: v for k, v in request.dict().items() if v is not None}
        success = await role_service.update_role(role_id, updates)
        if not success:
            raise HTTPException(status_code=404, detail="Role not found")
        return {"status": "updated"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{role_id}")
async def delete_role(role_id: str):
    """AIロールを削除"""
    try:
        success = await role_service.delete_role(role_id)
        if not success:
            raise HTTPException(status_code=404, detail="Role not found or cannot be deleted")
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/categories/list")
async def get_role_categories():
    """ロールカテゴリ一覧を取得"""
    try:
        categories = [
            {"id": "technical", "name": "技術系", "description": "開発、データ分析など"},
            {"id": "creative", "name": "クリエイティブ系", "description": "デザイン、コンテンツ制作など"},
            {"id": "business", "name": "ビジネス系", "description": "戦略、コンサルティングなど"},
            {"id": "custom", "name": "カスタム", "description": "ユーザー定義ロール"}
        ]
        return {"categories": categories}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

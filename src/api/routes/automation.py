from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...core.models import AutomationActionType, AutomationTriggerType
from ...services.automation_service import automation_service

router = APIRouter(prefix="/automation", tags=["automation"])


class AutomationRuleCreate(BaseModel):
    name: str
    trigger_type: AutomationTriggerType
    trigger_config: Dict[str, Any]
    action_type: AutomationActionType
    action_config: Dict[str, Any]


class AutomationRuleResponse(BaseModel):
    id: int
    name: str
    trigger_type: AutomationTriggerType
    trigger_config: Dict[str, Any]
    action_type: AutomationActionType
    action_config: Dict[str, Any]
    is_active: bool


@router.post("/rules", response_model=AutomationRuleResponse)
async def create_rule(project_id: int, payload: AutomationRuleCreate):
    try:
        rule = await automation_service.add_rule(
            project_id=project_id,
            name=payload.name,
            trigger_type=payload.trigger_type,
            trigger_config=payload.trigger_config,
            action_type=payload.action_type,
            action_config=payload.action_config,
        )
        return AutomationRuleResponse(
            id=rule.id,
            name=rule.name,
            trigger_type=rule.trigger_type,
            trigger_config=rule.trigger_config,
            action_type=rule.action_type,
            action_config=rule.action_config,
            is_active=rule.is_active,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/reload")
async def reload_automation():
    await automation_service.reload_rules()
    return {"status": "reloaded"}

from __future__ import annotations

import logging
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ...services.slack_service import slack_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/slack", tags=["slack"])

class MessageRequest(BaseModel):
    channel: str
    message: str
    thread_ts: str = None

class OAuthCallbackRequest(BaseModel):
    code: str
    state: str = None

@router.get("/status")
async def get_slack_status() -> Dict[str, Any]:
    """Get current Slack connection status"""
    try:
        return slack_service.get_connection_status()
    except Exception as e:
        logger.error(f"Error getting Slack status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/connect")
async def connect_slack() -> Dict[str, Any]:
    """Get OAuth URL for Slack connection"""
    try:
        # Generate a state token for security
        import secrets
        state = secrets.token_urlsafe(16)
        
        oauth_url = slack_service.get_oauth_url(state)
        return {
            "success": True,
            "oauth_url": oauth_url,
            "state": state
        }
    except Exception as e:
        logger.error(f"Error generating Slack OAuth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/callback")
async def handle_oauth_callback(request: OAuthCallbackRequest) -> Dict[str, Any]:
    """Handle OAuth callback from Slack"""
    try:
        result = slack_service.handle_oauth_callback(request.code)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    except Exception as e:
        logger.error(f"Error handling Slack OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disconnect")
async def disconnect_slack() -> Dict[str, Any]:
    """Disconnect from Slack"""
    try:
        success = slack_service.disconnect()
        return {"success": success}
    except Exception as e:
        logger.error(f"Error disconnecting Slack: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-message")
async def send_message(request: MessageRequest) -> Dict[str, Any]:
    """Send message to Slack channel"""
    try:
        result = slack_service.send_message(
            channel=request.channel,
            message=request.message,
            thread_ts=request.thread_ts
        )
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    except Exception as e:
        logger.error(f"Error sending Slack message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels")
async def get_channels(exclude_archived: bool = True) -> List[Dict[str, Any]]:
    """Get list of Slack channels"""
    try:
        return slack_service.get_channels(exclude_archived=exclude_archived)
    except Exception as e:
        logger.error(f"Error getting Slack channels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_users() -> List[Dict[str, Any]]:
    """Get list of Slack users"""
    try:
        return slack_service.get_users()
    except Exception as e:
        logger.error(f"Error getting Slack users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/team-info")
async def get_team_info() -> Dict[str, Any]:
    """Get Slack team information"""
    try:
        return slack_service.get_team_info()
    except Exception as e:
        logger.error(f"Error getting Slack team info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/oauth-url")
async def get_oauth_url(state: str = Query(None)) -> Dict[str, str]:
    """Get Slack OAuth URL"""
    try:
        if not state:
            import secrets
            state = secrets.token_urlsafe(16)
        
        oauth_url = slack_service.get_oauth_url(state)
        return {"oauth_url": oauth_url, "state": state}
    except Exception as e:
        logger.error(f"Error generating Slack OAuth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

import os
import logging
from typing import Optional, Dict, Any, List
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.oauth.installation_store import FileInstallationStore
from slack_sdk.oauth.state_store import FileOAuthStateStore

logger = logging.getLogger(__name__)

class SlackService:
    """Slack API integration service"""
    
    def __init__(self):
        self.client: Optional[WebClient] = None
        self.bot_token: Optional[str] = None
        self.user_token: Optional[str] = None
        self.team_id: Optional[str] = None
        
        # OAuth settings
        self.client_id = os.getenv("SLACK_CLIENT_ID")
        self.client_secret = os.getenv("SLACK_CLIENT_SECRET")
        self.signing_secret = os.getenv("SLACK_SIGNING_SECRET")
        self.redirect_uri = os.getenv("SLACK_REDIRECT_URI")
        
        # Initialize if tokens are available
        bot_token = os.getenv("SLACK_BOT_TOKEN")
        if bot_token:
            self.initialize_client(bot_token)
    
    def initialize_client(self, bot_token: str) -> bool:
        """Initialize Slack WebClient with bot token"""
        try:
            self.client = WebClient(token=bot_token)
            self.bot_token = bot_token
            
            # Test connection
            auth_response = self.client.auth_test()
            self.team_id = auth_response["team_id"]
            
            logger.info(f"Slack client initialized for team: {auth_response['team']}")
            return True
            
        except SlackApiError as e:
            logger.error(f"Failed to initialize Slack client: {e.response['error']}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error initializing Slack client: {str(e)}")
            return False
    
    def get_oauth_url(self, state: str = None) -> str:
        """Generate Slack OAuth URL"""
        if not self.client_id or not self.redirect_uri:
            raise ValueError("SLACK_CLIENT_ID and SLACK_REDIRECT_URI must be set")
        
        base_url = "https://slack.com/oauth/v2/authorize"
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "commands,chat:write,chat:write.public,channels:read,users:read,team:read",
            "user_scope": "identify",
        }
        
        if state:
            params["state"] = state
        
        param_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{param_string}"
    
    def handle_oauth_callback(self, code: str) -> Dict[str, Any]:
        """Handle OAuth callback and exchange code for tokens"""
        if not self.client_id or not self.client_secret or not self.redirect_uri:
            raise ValueError("Slack OAuth credentials not properly configured")
        
        try:
            response = WebClient().oauth_v2_access(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                code=code
            )
            
            # Store tokens
            self.bot_token = response["access_token"]
            self.team_id = response["team"]["id"]
            
            # Initialize client with new token
            self.initialize_client(self.bot_token)
            
            return {
                "success": True,
                "team_id": self.team_id,
                "team_name": response["team"]["name"],
                "bot_user_id": response["bot_user_id"],
                "access_token": response["access_token"]
            }
            
        except SlackApiError as e:
            logger.error(f"OAuth exchange failed: {e.response['error']}")
            return {"success": False, "error": e.response['error']}
        except Exception as e:
            logger.error(f"Unexpected error in OAuth callback: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_message(self, channel: str, message: str, thread_ts: str = None) -> Dict[str, Any]:
        """Send message to channel"""
        if not self.client:
            return {"success": False, "error": "Slack client not initialized"}
        
        try:
            kwargs = {
                "channel": channel,
                "text": message
            }
            
            if thread_ts:
                kwargs["thread_ts"] = thread_ts
            
            response = self.client.chat_postMessage(**kwargs)
            return {"success": True, "message_ts": response["ts"]}
            
        except SlackApiError as e:
            logger.error(f"Failed to send message: {e.response['error']}")
            return {"success": False, "error": e.response['error']}
    
    def get_channels(self, exclude_archived: bool = True) -> List[Dict[str, Any]]:
        """Get list of channels"""
        if not self.client:
            return []
        
        try:
            response = self.client.conversations_list(
                exclude_archived=exclude_archived,
                types="public_channel,private_channel"
            )
            return response["channels"]
            
        except SlackApiError as e:
            logger.error(f"Failed to get channels: {e.response['error']}")
            return []
    
    def get_users(self) -> List[Dict[str, Any]]:
        """Get list of users"""
        if not self.client:
            return []
        
        try:
            response = self.client.users_list()
            return response["members"]
            
        except SlackApiError as e:
            logger.error(f"Failed to get users: {e.response['error']}")
            return []
    
    def get_team_info(self) -> Dict[str, Any]:
        """Get team information"""
        if not self.client:
            return {}
        
        try:
            response = self.client.team_info()
            return response["team"]
            
        except SlackApiError as e:
            logger.error(f"Failed to get team info: {e.response['error']}")
            return {}
    
    def disconnect(self) -> bool:
        """Disconnect from Slack"""
        try:
            self.client = None
            self.bot_token = None
            self.user_token = None
            self.team_id = None
            logger.info("Slack service disconnected")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting Slack: {str(e)}")
            return False
    
    def is_connected(self) -> bool:
        """Check if connected to Slack"""
        return self.client is not None and self.bot_token is not None
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get current connection status"""
        if not self.is_connected():
            return {
                "connected": False,
                "team_name": None,
                "team_id": None
            }
        
        try:
            team_info = self.get_team_info()
            return {
                "connected": True,
                "team_name": team_info.get("name"),
                "team_id": self.team_id
            }
        except Exception as e:
            logger.error(f"Error getting connection status: {str(e)}")
            return {
                "connected": False,
                "team_name": None,
                "team_id": None,
                "error": str(e)
            }

# Global instance
slack_service = SlackService()

from .automation import router as automation_router
from .chat import router as chat_router
from .tools import router as tools_router
from .providers import router as providers_router
from .conversations import router as conversations_router
from .memories import router as memories_router
from .models import router as models_router
from .models_list import router as models_list_router
from .projects import router as projects_router
from .google import router as google_router
from .documents import router as documents_router
from .roles import router as roles_router
from .media import router as media_router
from .meeting import router as meeting_router
from .ocr import router as ocr_router
from .discord import router as discord_router
from .line import router as line_router
from .slack import router as slack_router
from .workflows import router as workflows_router

__all__ = [
    "automation_router",
    "chat_router",
    "tools_router",
    "providers_router",
    "conversations_router",
    "memories_router",
    "models_router",
    "models_list_router",
    "projects_router",
    "google_router",
    "documents_router",
    "roles_router",
    "media_router",
    "meeting_router",
    "ocr_router",
    "discord_router",
    "line_router",
    "slack_router",
    "workflows_router",
]

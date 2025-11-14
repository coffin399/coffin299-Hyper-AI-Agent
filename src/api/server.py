from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..core.config import get_settings
from ..core.database import init_db
from ..services.automation_service import automation_service
from .routes import (
    automation_router,
    chat_router,
    conversations_router,
    discord_router,
    documents_router,
    google_router,
    line_router,
    meeting_router,
    media_router,
    memories_router,
    models_router,
    models_list_router,
    ocr_router,
    projects_router,
    providers_router,
    roles_router,
    tools_router,
)

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await automation_service.start()
    logger.info("Application startup complete")
    yield
    await automation_service.stop()
    logger.info("Application shutdown complete")


app = FastAPI(title="Hyper AI Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(automation_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(discord_router)
app.include_router(documents_router)
app.include_router(google_router)
app.include_router(line_router)
app.include_router(meeting_router)
app.include_router(media_router)
app.include_router(memories_router)
app.include_router(models_router)
app.include_router(models_list_router)
app.include_router(ocr_router)
app.include_router(projects_router)
app.include_router(providers_router)
app.include_router(roles_router)
app.include_router(tools_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Hyper AI Agent API"}

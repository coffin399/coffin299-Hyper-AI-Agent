from __future__ import annotations

import asyncio
import logging
import uvicorn

from .api.server import app
from .core.config import get_settings

settings = get_settings()
logging.basicConfig(level=logging.INFO)


def start_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    start_server()

from __future__ import annotations

import argparse
import asyncio
import logging
import uvicorn

from .api.server import app
from .core.config import get_settings

settings = get_settings()
logging.basicConfig(level=logging.INFO)


def start_server(host: str = "127.0.0.1", port: int = None):
    """Start the FastAPI backend server.
    
    Args:
        host: Host to bind to (default: 127.0.0.1 for local mode)
        port: Port to bind to (default: from settings.backend_port)
    """
    if port is None:
        port = settings.backend_port
    
    logging.info(f"Starting Hyper AI Agent backend on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hyper AI Agent Backend Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=None, help="Port to bind to")
    args = parser.parse_args()
    
    start_server(host=args.host, port=args.port)

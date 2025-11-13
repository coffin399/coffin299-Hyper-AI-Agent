from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

import httpx
from bs4 import BeautifulSoup

from ..base import Tool, ToolContext, ToolResult


class WebScraperTool(Tool):
    """Fetch and parse web pages with optional CSS selectors."""

    def __init__(self) -> None:
        super().__init__(
            name="web_scraper",
            description="Fetch webpage content and extract text using CSS selectors.",
        )

    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        url = arguments.get("url")
        if not url:
            return ToolResult(success=False, output=None, description="Missing 'url' argument")

        selector = arguments.get("selector")
        timeout = float(arguments.get("timeout", 10.0))

        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                html = response.text

            if not selector:
                return ToolResult(success=True, output={"html": html})

            text = await asyncio.to_thread(self._extract_with_selector, html, selector)
            return ToolResult(success=True, output={"text": text})
        except Exception as exc:  # pragma: no cover - network variability
            return ToolResult(success=False, output=None, description=str(exc))

    @staticmethod
    def _extract_with_selector(html: str, selector: str) -> Optional[str]:
        soup = BeautifulSoup(html, "lxml")
        selection = soup.select(selector)
        if not selection:
            return None
        text = "\n\n".join(elem.get_text(separator=" ", strip=True) for elem in selection)
        return text or None

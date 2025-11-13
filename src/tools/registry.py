from __future__ import annotations

from typing import Dict, List, Optional

from .base import Tool
from .builtins import (
    CalendarTool,
    CodeExecutionTool,
    DatabaseTool,
    EmailTool,
    FileSystemTool,
    WebScraperTool,
)

_builtin_tools: List[Tool] = [
    FileSystemTool(),
    WebScraperTool(),
    CalendarTool(),
    EmailTool(),
    CodeExecutionTool(),
    DatabaseTool(),
]

_tool_registry: Dict[str, Tool] = {tool.name: tool for tool in _builtin_tools}


def register_tool(tool: Tool) -> None:
    _tool_registry[tool.name] = tool


def get_tool(name: str) -> Optional[Tool]:
    return _tool_registry.get(name)


def list_tools() -> List[Dict[str, str]]:
    return [tool.to_definition() for tool in _tool_registry.values()]

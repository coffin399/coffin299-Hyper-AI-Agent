from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class ToolContext:
    """Contextual data passed to tools during execution."""

    project_id: int
    project_name: str
    data_dir: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolResult:
    """Standardized tool execution result."""

    success: bool
    output: Any
    description: Optional[str] = None


class Tool(abc.ABC):
    """Abstract base class for all tools."""

    name: str
    description: str

    def __init__(self, name: str, description: str) -> None:
        self.name = name
        self.description = description

    @abc.abstractmethod
    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        """Execute the tool with the provided context and arguments."""

    def to_definition(self) -> Dict[str, Any]:
        return {"name": self.name, "description": self.description}

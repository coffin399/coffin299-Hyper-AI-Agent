from __future__ import annotations

from typing import Any, Dict

from ...services.email_service import EmailService, email_service
from ..base import Tool, ToolContext, ToolResult


class EmailTool(Tool):
    """Send email via configured SMTP settings and log the result."""

    def __init__(self, service: EmailService | None = None) -> None:
        super().__init__(
            name="email",
            description="Send an email using the configured SMTP provider.",
        )
        self.service = service or email_service

    async def run(self, context: ToolContext, arguments: Dict[str, Any]) -> ToolResult:
        to_address = arguments.get("to") or arguments.get("to_address")
        subject = arguments.get("subject")
        body = arguments.get("body")

        if not to_address or not subject or not body:
            return ToolResult(
                success=False,
                output=None,
                description="'to', 'subject', and 'body' arguments are required",
            )

        metadata = arguments.get("metadata")

        log = await self.service.send_email(
            project_id=context.project_id,
            to_address=str(to_address),
            subject=str(subject),
            body=str(body),
            metadata=metadata if isinstance(metadata, dict) else None,
        )

        return ToolResult(
            success=log.status == "sent",
            output={
                "id": log.id,
                "status": log.status,
                "to": log.to_address,
                "subject": log.subject,
            },
            description=None if log.status == "sent" else "Email queued or failed",
        )

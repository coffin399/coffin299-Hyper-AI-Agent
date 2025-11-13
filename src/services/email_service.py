from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage
from typing import Optional
import json

from ..core.config import get_settings
from ..core.database import session_scope
from ..core.models import EmailLog


class EmailService:
    """Send emails via SMTP (when configured) and persist logs."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def send_email(
        self,
        project_id: int,
        to_address: str,
        subject: str,
        body: str,
        metadata: Optional[dict] = None,
    ) -> EmailLog:
        status = "queued"
        metadata = metadata or {}
        message_id = None

        if self.settings.smtp_host:
            try:
                message_id = await asyncio.to_thread(
                    self._deliver_email,
                    to_address,
                    subject,
                    body,
                )
                status = "sent"
            except Exception as exc:  # pragma: no cover - network dependent
                status = "failed"
                metadata.setdefault("error", str(exc))

        async with session_scope() as session:
            log = EmailLog(
                project_id=project_id,
                to_address=to_address,
                subject=subject,
                body=body,
                status=status,
                metadata_json=json.dumps({**metadata, "message_id": message_id}) if metadata else json.dumps({"message_id": message_id}),
            )
            session.add(log)
            await session.flush()
            await session.refresh(log)
            return log

    def _deliver_email(self, to_address: str, subject: str, body: str) -> Optional[str]:
        msg = EmailMessage()
        msg["From"] = self.settings.smtp_from or self.settings.smtp_username or "no-reply@example.com"
        msg["To"] = to_address
        msg["Subject"] = subject
        msg.set_content(body)

        host = self.settings.smtp_host
        port = self.settings.smtp_port or (465 if self.settings.smtp_use_ssl else 587)

        if self.settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                self._login_if_needed(server)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                if self.settings.smtp_use_tls:
                    server.starttls()
                self._login_if_needed(server)
                server.send_message(msg)
        return msg["Message-ID"]

    def _login_if_needed(self, server: smtplib.SMTP) -> None:
        if self.settings.smtp_username and self.settings.smtp_password:
            server.login(self.settings.smtp_username, self.settings.smtp_password)


email_service = EmailService()

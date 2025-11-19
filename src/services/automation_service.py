from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

from sqlalchemy import select

from ..core.config import get_settings
from ..core.database import session_scope
from ..core.models import AutomationActionType, AutomationRule, AutomationTriggerType
from .tool_service import ToolService, tool_service

logger = logging.getLogger(__name__)


class AutomationService:
    """Manage cron, file watch, and webhook triggers and execute actions."""

    def __init__(self, tool_svc: ToolService | None = None) -> None:
        self.settings = get_settings()
        self.tool_service = tool_svc or tool_service
        self.scheduler = AsyncIOScheduler(timezone="UTC")
        self.file_observers: Dict[int, Observer] = {}
        self._running = False
        self._loop: asyncio.AbstractEventLoop | None = None

    async def start(self) -> None:
        if self._running:
            return
        self._loop = asyncio.get_running_loop()
        await self._load_rules()
        self.scheduler.start()
        self._running = True
        logger.info("Automation service started")

    async def stop(self) -> None:
        if not self._running:
            return
        self.scheduler.shutdown(wait=True)
        for obs in self.file_observers.values():
            obs.stop()
            obs.join()
        self.file_observers.clear()
        self._running = False
        logger.info("Automation service stopped")

    async def reload_rules(self) -> None:
        await self.stop()
        await self.start()

    async def add_rule(
        self,
        project_id: int,
        name: str,
        trigger_type: AutomationTriggerType,
        trigger_config: Dict[str, Any],
        action_type: AutomationActionType,
        action_config: Dict[str, Any],
    ) -> AutomationRule:
        async with session_scope() as session:
            rule = AutomationRule(
                project_id=project_id,
                name=name,
                trigger_type=trigger_type,
                trigger_config=trigger_config,
                action_type=action_type,
                action_config=action_config,
                is_active=True,
            )
            session.add(rule)
            await session.flush()
            await session.refresh(rule)
            await self._schedule_rule(rule)
            return rule

    async def _load_rules(self) -> None:
        async with session_scope() as session:
            result = await session.scalars(
                select(AutomationRule).where(AutomationRule.is_active.is_(True))
            )
            rules = list(result)
            for rule in rules:
                await self._schedule_rule(rule)

    async def _schedule_rule(self, rule: AutomationRule) -> None:
        try:
            if rule.trigger_type == AutomationTriggerType.CRON:
                cron_expr = rule.trigger_config.get("cron")
                if not cron_expr:
                    return
                self.scheduler.add_job(
                    self._execute_rule,
                    trigger="cron",
                    id=f"rule-{rule.id}",
                    args=[rule],
                    **cron_expr,
                )
            elif rule.trigger_type == AutomationTriggerType.FILE_WATCH:
                path = rule.trigger_config.get("path")
                if not path:
                    return
                if self._loop is None:
                    logger.warning("Cannot schedule file watch rule %s: loop not captured", rule.id)
                    return
                handler = _FileWatchHandler(rule, self._execute_rule, self._loop)
                observer = Observer()
                observer.schedule(handler, str(path), recursive=True)
                observer.start()
                self.file_observers[rule.id] = observer
        except Exception as exc:  # pragma: no cover - scheduler errors
            logger.error("Failed to schedule rule %s: %s", rule.id, exc)

    async def _execute_rule(self, rule: AutomationRule) -> None:
        try:
            if rule.action_type == AutomationActionType.TOOL:
                tool_name = rule.action_config.get("tool")
                arguments = rule.action_config.get("arguments", {})
                if not tool_name:
                    logger.warning("Rule %s missing tool name", rule.id)
                    return
                result = await self.tool_service.execute(
                    project_id=rule.project_id,
                    project_name=f"project_{rule.project_id}",
                    tool_name=tool_name,
                    arguments=arguments,
                )
                if result.success:
                    logger.info("Executed tool %s for rule %s", tool_name, rule.id)
                else:
                    logger.warning("Tool %s failed for rule %s: %s", tool_name, rule.id, result.description)
            elif rule.action_type == AutomationActionType.WORKFLOW:
                logger.info("Workflow execution not yet implemented for rule %s", rule.id)
        except Exception as exc:  # pragma: no cover - runtime errors
            logger.error("Error executing rule %s: %s", rule.id, exc)


class _FileWatchHandler(FileSystemEventHandler):
    def __init__(self, rule: AutomationRule, executor, loop: asyncio.AbstractEventLoop) -> None:
        self.rule = rule
        self.executor = executor
        self.loop = loop

    def on_any_event(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        asyncio.run_coroutine_threadsafe(self.executor(self.rule), self.loop)


automation_service = AutomationService()

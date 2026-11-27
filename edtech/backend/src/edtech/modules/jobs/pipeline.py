"""Pipeline definitions: a job kind is an ordered list of stages, each run on a given queue.

Stage handlers receive a :class:`StageContext` and return a :class:`StageResult`. They must be
idempotent: a stage may run again if a worker dies before its result is saved.

Errors a handler may raise:
* :class:`StageFailed` — permanent (unreadable document, unsupported subject...): the job fails and
  its credits are refunded;
* :class:`StageRetryable` (or any unexpected exception / timeout) — transient: the job is retried
  with exponential backoff, then failed and refunded after ``max_attempts``;
* :class:`StageNeedsInput` — a clarification is required from the user (cahier des charges §6).
"""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass, field
from typing import Any

from edtech.infra.db import Database
from edtech.infra.queue import Queue
from edtech.infra.storage import ObjectStorage
from edtech.settings import Settings

# Étapes du pipeline de correction (cahier des charges §5). Leurs gestionnaires sont enregistrés
# au fil des phases 2 à 5 ; le pipeline n'est activé que lorsque toutes ses étapes existent.
CORRECTION_STAGES = (
    "receive",
    "validate_file",
    "preprocess_image",
    "extract",
    "reconstruct_statement",
    "identify_questions",
    "classify",
    "solve",
    "verify",
    "compose_correction",
    "script_video",
    "synthesize_voice",
    "animate",
    "assemble_video",
    "quality_check",
    "deliver",
)


class StageFailed(Exception):
    def __init__(self, code: str, message: str, *, data: Mapping[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.data = dict(data or {})


class StageRetryable(Exception):
    def __init__(self, message: str, *, data: Mapping[str, Any] | None = None) -> None:
        super().__init__(message)
        self.data = dict(data or {})


class StageNeedsInput(Exception):
    def __init__(self, question_key: str, *, params: Mapping[str, Any] | None = None) -> None:
        super().__init__(question_key)
        self.question_key = question_key
        self.params = dict(params or {})


@dataclass(frozen=True, slots=True)
class TraceEntry:
    """Provenance of an automated result (model, provider, version) — §6 « traçabilité »."""

    stage: str
    provider: str
    model: str
    version: str | None = None
    usage: Mapping[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "stage": self.stage,
            "provider": self.provider,
            "model": self.model,
            "version": self.version,
            "usage": dict(self.usage),
        }


@dataclass(slots=True)
class StageContext:
    job_id: uuid.UUID
    user_id: uuid.UUID
    kind: str
    stage: str
    attempt: int
    input: Mapping[str, Any]
    outputs: Mapping[str, Any]  # sorties des étapes précédentes
    settings: Settings
    db: Database
    storage: ObjectStorage


@dataclass(slots=True)
class StageResult:
    output: dict[str, Any] = field(default_factory=dict)
    trace: list[TraceEntry] = field(default_factory=list)
    events: list[tuple[str, dict[str, Any]]] = field(default_factory=list)


StageHandler = Callable[[StageContext], Awaitable[StageResult]]


@dataclass(frozen=True, slots=True)
class StageSpec:
    name: str
    handler: StageHandler
    queue: Queue = Queue.DEFAULT
    timeout_seconds: float = 300.0


class PipelineRegistry:
    def __init__(self) -> None:
        self._pipelines: dict[str, tuple[StageSpec, ...]] = {}

    def register(self, kind: str, stages: list[StageSpec]) -> None:
        if not stages:
            raise ValueError("Un pipeline doit contenir au moins une étape")
        names = [s.name for s in stages]
        if len(set(names)) != len(names):
            raise ValueError(f"Étapes en double dans le pipeline {kind!r}")
        self._pipelines[kind] = tuple(stages)

    def get(self, kind: str) -> tuple[StageSpec, ...]:
        try:
            return self._pipelines[kind]
        except KeyError as exc:
            raise LookupError(f"Pipeline inconnu : {kind!r}") from exc

    def __contains__(self, kind: object) -> bool:
        return kind in self._pipelines

    def kinds(self) -> list[str]:
        return sorted(self._pipelines)


def default_registry() -> PipelineRegistry:
    """Pipelines available in this release. The correction pipeline arrives with phase 2."""
    return PipelineRegistry()

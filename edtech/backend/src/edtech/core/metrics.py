"""Prometheus metrics (resource consumption and business counters).

Labels are kept low-cardinality: HTTP metrics use the route *template* (``/api/v1/jobs/{job_id}``),
never the raw path.
"""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from prometheus_client import CollectorRegistry, Counter, Histogram

REGISTRY = CollectorRegistry(auto_describe=True)

HTTP_REQUESTS = Counter(
    "edtech_http_requests_total",
    "HTTP requests",
    ["method", "route", "status"],
    registry=REGISTRY,
)
HTTP_LATENCY = Histogram(
    "edtech_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "route"],
    registry=REGISTRY,
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30),
)
TELEGRAM_UPDATES = Counter(
    "edtech_telegram_updates_total",
    "Telegram updates received",
    ["kind", "outcome"],
    registry=REGISTRY,
)
JOB_STAGE_DURATION = Histogram(
    "edtech_job_stage_duration_seconds",
    "Duration of a pipeline stage",
    ["stage", "outcome"],
    registry=REGISTRY,
    buckets=(0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600, 1800),
)
JOBS_FINISHED = Counter(
    "edtech_jobs_finished_total",
    "Jobs reaching a terminal state",
    ["kind", "status"],
    registry=REGISTRY,
)
CREDIT_OPERATIONS = Counter(
    "edtech_credit_operations_total",
    "Credit ledger operations",
    ["kind"],
    registry=REGISTRY,
)


async def metrics_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    start = time.perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    finally:
        route = request.scope.get("route")
        template = getattr(route, "path", "unmatched")
        HTTP_REQUESTS.labels(request.method, template, str(status)).inc()
        HTTP_LATENCY.labels(request.method, template).observe(time.perf_counter() - start)

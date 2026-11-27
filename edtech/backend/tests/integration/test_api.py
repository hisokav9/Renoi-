from __future__ import annotations

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy import select

from edtech.container import Container
from edtech.modules.audit.models import AuditLog
from edtech.modules.jobs import service as jobs
from edtech.modules.jobs.pipeline import PipelineRegistry, StageResult, StageSpec
from edtech.modules.support import service as support
from tests.conftest import auth_headers, create_user


async def _noop(_ctx: object) -> StageResult:
    return StageResult()


async def test_health_endpoints(client: httpx.AsyncClient) -> None:
    assert (await client.get("/health/live")).json() == {"status": "ok"}
    ready = await client.get("/health/ready")
    assert ready.status_code == 200
    assert ready.json()["checks"] == {"database": "ok", "redis": "ok", "storage": "ok"}
    assert ready.headers["x-request-id"]
    assert ready.headers["x-content-type-options"] == "nosniff"


async def test_metrics_require_token_when_configured(
    client: httpx.AsyncClient, container: Container
) -> None:
    await client.get("/health/live")
    assert (await client.get("/metrics")).status_code == 200
    container.settings.metrics_token = SecretStr("m-token")
    try:
        assert (await client.get("/metrics")).status_code == 401
        ok = await client.get("/metrics", headers={"Authorization": "Bearer m-token"})
    finally:
        container.settings.metrics_token = None
    assert ok.status_code == 200
    assert 'edtech_http_requests_total{method="GET",route="/health/live"' in ok.text


async def test_protected_routes_require_a_valid_token(client: httpx.AsyncClient) -> None:
    for path in ("/api/v1/me", "/api/v1/jobs", "/api/v1/me/credits"):
        response = await client.get(path)
        assert response.status_code == 401
        assert response.json()["code"] == "unauthorized"
    bad = await client.get("/api/v1/me", headers={"Authorization": "Bearer nope"})
    assert bad.status_code == 401


@pytest.mark.usefixtures("seeded")
async def test_profile_crud(client: httpx.AsyncClient, container: Container) -> None:
    user = await create_user(container)
    headers = auth_headers(container.settings, user)
    countries = (await client.get("/api/v1/curriculum/countries")).json()
    assert [c["code"] for c in countries] == ["NE"]
    programs = (await client.get("/api/v1/curriculum/countries/ne/programs")).json()
    assert programs[0]["verified"] is False  # brouillon à valider
    detail = (await client.get(f"/api/v1/curriculum/programs/{programs[0]['id']}")).json()
    tle = next(g for g in detail["grades"] if g["code"] == "TLE")
    series_d = next(s for s in detail["series"] if s["code"] == "D")

    response = await client.patch(
        "/api/v1/me",
        headers=headers,
        json={
            "locale": "en",
            "country_code": "NE",
            "program_id": programs[0]["id"],
            "grade_level_id": tle["id"],
            "series_id": series_d["id"],
            "preferences": {"explanation_level": "detailed"},
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["locale"] == "en"
    assert body["series_id"] == series_d["id"]
    assert body["preferences"] == {"explanation_level": "detailed", "default_mode": "text"}

    invalid = await client.patch("/api/v1/me", headers=headers, json={"locale": "xx"})
    assert invalid.status_code == 422
    unknown_field = await client.patch("/api/v1/me", headers=headers, json={"role": "admin"})
    assert unknown_field.status_code == 422

    credits = (await client.get("/api/v1/me/credits", headers=headers)).json()
    assert credits["balance"] == 5
    assert credits["transactions"][0]["kind"] == "grant"

    assert (await client.delete("/api/v1/me", headers=headers)).status_code == 204
    assert (await client.get("/api/v1/me", headers=headers)).status_code == 401


async def test_jobs_are_only_visible_to_their_owner_or_staff(
    client: httpx.AsyncClient, container: Container, registry: PipelineRegistry
) -> None:
    registry.register("demo", [StageSpec("a", _noop)])
    owner, other = await create_user(container), await create_user(container)
    reviewer = await create_user(container, role="reviewer")
    async with container.db.session() as s:
        job = await jobs.create_job(
            s,
            container.dispatcher,
            registry,
            user_id=owner.id,
            kind="demo",
            source="api",
            input={},
            credits_cost=1,
        )
    url = f"/api/v1/jobs/{job.id}"

    mine = await client.get(url, headers=auth_headers(container.settings, owner))
    assert mine.status_code == 200
    assert [e["event"] for e in mine.json()["events"]] == ["job_created"]
    assert (
        await client.get(url, headers=auth_headers(container.settings, other))
    ).status_code == 404
    assert (
        await client.get(url, headers=auth_headers(container.settings, reviewer))
    ).status_code == 200
    listing = await client.get("/api/v1/jobs", headers=auth_headers(container.settings, owner))
    assert listing.json()["total"] == 1

    stolen = await client.post(f"{url}/cancel", headers=auth_headers(container.settings, other))
    assert stolen.status_code == 404
    cancelled = await client.post(f"{url}/cancel", headers=auth_headers(container.settings, owner))
    assert cancelled.json()["status"] == "cancelled"
    again = await client.post(f"{url}/cancel", headers=auth_headers(container.settings, owner))
    assert again.status_code == 409


async def test_admin_operations_are_authorized_and_audited(
    client: httpx.AsyncClient, container: Container
) -> None:
    admin = await create_user(container, role="admin")
    student = await create_user(container)
    support_agent = await create_user(container, role="support")
    url = f"/api/v1/admin/users/{student.id}/credits"
    body = {"amount": 10, "reason": "Geste commercial", "idempotency_key": "ticket-123"}

    forbidden = await client.post(url, json=body, headers=auth_headers(container.settings, student))
    assert forbidden.status_code == 403
    granted = await client.post(url, json=body, headers=auth_headers(container.settings, admin))
    assert granted.status_code == 200, granted.text
    replay = await client.post(url, json=body, headers=auth_headers(container.settings, admin))
    assert replay.json()["id"] == granted.json()["id"]
    assert granted.json()["balance_after"] == 15

    role_url = f"/api/v1/admin/users/{student.id}/role"
    changed = await client.put(
        role_url, json={"role": "teacher"}, headers=auth_headers(container.settings, admin)
    )
    assert changed.json()["role"] == "teacher"
    bad_role = await client.put(
        role_url, json={"role": "god"}, headers=auth_headers(container.settings, admin)
    )
    assert bad_role.status_code == 400
    self_change = await client.put(
        f"/api/v1/admin/users/{admin.id}/role",
        json={"role": "student"},
        headers=auth_headers(container.settings, admin),
    )
    assert self_change.status_code == 409
    by_support = await client.put(
        role_url, json={"role": "admin"}, headers=auth_headers(container.settings, support_agent)
    )
    assert by_support.status_code == 403

    async with container.db.session() as s:
        await support.open_ticket(s, user_id=student.id, channel="telegram", message="Aide")
    tickets = await client.get(
        "/api/v1/admin/support/tickets", headers=auth_headers(container.settings, support_agent)
    )
    assert [t["message"] for t in tickets.json()] == ["Aide"]

    async with container.db.session() as s:
        actions = (
            (
                await s.execute(
                    select(AuditLog.action).where(
                        AuditLog.actor_user_id == admin.id, AuditLog.action != "user.registered"
                    )
                )
            )
            .scalars()
            .all()
        )
    assert sorted(actions) == ["credits.granted", "user.role_changed"]


async def test_unknown_route_and_validation_errors_use_problem_json(
    client: httpx.AsyncClient,
) -> None:
    response = await client.get("/api/v1/curriculum/programs/not-a-uuid")
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "validation_error"

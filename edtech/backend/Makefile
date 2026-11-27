.PHONY: install services lint typecheck test cov check migrate seed run worker beat poll

install:        ## Installer les dépendances (dev incluses)
	uv sync

services:       ## Démarrer PostgreSQL, Redis et MinIO en local
	docker compose -f ../docker-compose.yml up -d postgres redis minio

lint:
	uv run ruff check src tests migrations
	uv run ruff format --check src tests migrations

typecheck:
	uv run mypy

test:
	uv run pytest

cov:
	uv run pytest --cov --cov-report=term-missing

check: lint typecheck test   ## Tout ce que la CI vérifie

migrate:
	uv run alembic upgrade head

seed:
	uv run edtech seed

run:
	uv run uvicorn edtech.main:create_app --factory --reload --port 8000

worker:
	uv run celery -A edtech.worker.main worker -Q default,ingest,ai,media --concurrency 2 --loglevel INFO

beat:
	uv run celery -A edtech.worker.main beat --loglevel INFO

poll:           ## Bot Telegram sans webhook (développement)
	uv run edtech telegram-poll

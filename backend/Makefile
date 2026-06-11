install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --port 8000

worker:
	celery -A app.core.celery_app worker --loglevel=info -Q calls,whatsapp

beat:
	celery -A app.core.celery_app beat --loglevel=info

migrate:
	alembic upgrade head

makemigration:
	alembic revision --autogenerate -m "$(msg)"

test:
	pytest tests/ -v

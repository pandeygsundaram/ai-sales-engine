#!/bin/bash
# AI Sales Engine - One-Command Launcher for Demo

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Starting AI Sales Engine..."

# 1. Start ngrok
echo "Starting ngrok on domain unridged-hyman-unvenomously.ngrok-free.dev..."
ngrok http --domain=unridged-hyman-unvenomously.ngrok-free.dev 8000 > /dev/null 2>&1 &
NGROK_PID=$!

# 2. Start Celery Worker
echo "Starting Celery worker..."
cd "$DIR/backend"
venv/bin/celery -A app.core.celery_app worker --loglevel=info -Q calls,whatsapp > /dev/null 2>&1 &
CELERY_PID=$!

# 3. Start Backend
echo "Starting FastAPI Backend on port 8000..."
venv/bin/uvicorn app.main:app --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!

# 4. Start Frontend
echo "Starting Vite Frontend on port 3000..."
cd "$DIR/frontend"
npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "================================================="
echo "🚀 AI Sales Engine is running!"
echo "• Frontend UI: http://localhost:3000"
echo "• Backend Docs: http://localhost:8000/docs"
echo "• Webhook URL: https://unridged-hyman-unvenomously.ngrok-free.dev"
echo "Press Ctrl+C to stop all services."
echo "================================================="

cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $FRONTEND_PID $BACKEND_PID $CELERY_PID $NGROK_PID 2>/dev/null
    exit
}

trap cleanup INT TERM
wait

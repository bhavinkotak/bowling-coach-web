#!/bin/bash
# Quick Dev Start - Backend + Frontend Web Dev Server (for testing new UI components)

set -e

echo "🚀 Starting Development Environment"
echo "=================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/cricket-bowling-coach"

# Ensure logs directory exists
mkdir -p "$SCRIPT_DIR/logs"

# 1. Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend is already running"
else
    echo "🚀 Starting backend server..."
    cd "$BACKEND_DIR/backend" || exit 1
    
    # Clear old log
    > "$SCRIPT_DIR/logs/backend.log"
    
    # Enable cache logging
    export ENABLE_CACHE_LOGGING=1
    
    # Start backend in background
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_DIR/backend.pid"
    echo "✅ Backend starting (PID: $BACKEND_PID)"
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        sleep 1
    done
fi

cd "$SCRIPT_DIR"

# 2. Start Vite dev server
echo "🔨 Starting Vite dev server..."
echo ""
echo "=================================="
echo "✅ DEV ENVIRONMENT READY!"
echo "=================================="
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "📋 View Logs:"
echo "   Backend: tail -f $SCRIPT_DIR/logs/backend.log"
echo ""
echo "🎨 New Components Available:"
echo "   - SnapshotGallery with carousel"
echo "   - VideoPlayerModal with advanced controls"
echo "   - AngleSelectionBanner for multi-video"
echo "   - KeyboardShortcutsGuide (press '?' key)"
echo ""
echo "⌨️  Keyboard Shortcuts:"
echo "   Press '?' in app to see all shortcuts"
echo ""
echo "🔄 Hot Reload:"
echo "   Changes to .tsx/.ts/.css files will auto-reload"
echo ""
echo "================================================"
echo ""

# Start Vite dev server (this will keep running in foreground)
npm run dev

#!/bin/bash

# HackerRank Orchestrate - Auto Start Script
# Starts backend and frontend automatically

echo ""
echo "========================================================================="
echo ""
echo "  🚀 HackerRank Orchestrate - Message Notification Router"
echo "     Starting up..."
echo ""
echo "========================================================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Start Backend
echo "⚙️  Starting Backend on port 8000..."
cd "$SCRIPT_DIR/backend"
python main.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is responding
max_retries=10
retry=0
while [ $retry -lt $max_retries ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    retry=$((retry + 1))
    if [ $retry -lt $max_retries ]; then
        echo "⏳ Waiting... ($retry/$max_retries)"
        sleep 2
    fi
done

if [ $retry -eq $max_retries ]; then
    echo "⚠️  Warning: Backend may not have started properly. Continuing anyway..."
fi

echo ""

# Start Frontend
echo "🎨 Starting Frontend on port 5173..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend starting..."

echo ""
echo "========================================================================="
echo ""
echo "  🌐 Dashboard will open shortly at:"
echo "     📱 http://localhost:5173"
echo ""
echo "  📚 API Documentation:"
echo "     📖 http://localhost:8000/docs"
echo ""
echo "  💡 Tip: Press Ctrl+C to stop both services"
echo ""
echo "========================================================================="
echo ""

# Wait for both processes
wait

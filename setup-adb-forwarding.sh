#!/bin/bash
# Setup ADB reverse port forwarding for backend connection
# This allows the Android emulator/device to connect to localhost:8000

echo "🔌 Setting up ADB reverse port forwarding..."

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb command not found"
    echo "   Please install Android SDK Platform-Tools"
    exit 1
fi

# Check if device/emulator is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ Error: No Android device/emulator connected"
    echo "   Please start an emulator or connect a device"
    echo ""
    echo "Current ADB devices:"
    adb devices
    exit 1
fi

# Setup reverse port forwarding
echo "   Forwarding tcp:8000 (backend API)..."
if adb reverse tcp:8000 tcp:8000; then
    echo "✅ Port forwarding setup successfully!"
    echo ""
    echo "📱 Your Android app can now connect to:"
    echo "   http://localhost:8000 (backend API)"
    echo ""
    echo "Active port forwards:"
    adb reverse --list
else
    echo "❌ Failed to setup port forwarding"
    exit 1
fi

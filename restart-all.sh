#!/bin/bash
# Restart Everything - Backend + Frontend Web App (All in background, no new terminals)

set -e  # Exit on error (will be handled by trap)

echo "🔄 Restarting Cricket Bowling Coach - Web App Stack"
echo "================================================"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/cricket-bowling-coach"

# Ensure logs directory exists
mkdir -p "$SCRIPT_DIR/logs"

# Trap errors and interruptions
trap 'echo "❌ Script interrupted or failed. Check logs for details."; exit 1' ERR INT TERM

# 1. Stop existing processes
echo "🛑 Stopping existing processes..."

# Kill backend processes (try graceful first, then force)
if pgrep -f "uvicorn.*app.main:app" >/dev/null 2>&1; then
    echo "   Stopping backend..."
    pkill -TERM -f "uvicorn.*app.main:app" 2>/dev/null || true
    sleep 2
    # Force kill if still running
    if pgrep -f "uvicorn.*app.main:app" >/dev/null 2>&1; then
        pkill -9 -f "uvicorn.*app.main:app" 2>/dev/null || true
        sleep 1
    fi
    echo "✅ Stopped backend"
else
    echo "ℹ️  No backend running"
fi

# Wait for ports to be released
echo "⏳ Waiting for ports to be released..."
sleep 2

# Force kill any process using port 8000 (but be more careful)
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "🔴 Port 8000 is in use. Checking what's using it..."
    
    # Get details about processes using port 8000
    PORT_PROCS=$(lsof -i:8000 2>/dev/null || true)
    
    # Check if it's Python/uvicorn (backend) - only kill those
    if echo "$PORT_PROCS" | grep -qE "(Python|uvicorn)"; then
        echo "   Found Python/uvicorn processes on port 8000, killing them..."
        lsof -ti:8000 | while read pid; do
            # Check if this PID is Python/uvicorn
            if ps -p $pid -o comm= 2>/dev/null | grep -qE "(Python|python)"; then
                echo "   Killing Python process $pid"
                kill -9 $pid 2>/dev/null || true
            fi
        done
        sleep 1
    else
        echo "   ⚠️  Port 8000 is used by non-Python process:"
        echo "$PORT_PROCS"
        echo "   Skipping kill to preserve other processes (like emulator)"
    fi
fi

# Also kill any remaining uvicorn processes (more targeted)
if pgrep -f "uvicorn.*app.main:app" >/dev/null 2>&1; then
    echo "🔴 Killing remaining uvicorn processes..."
    pkill -9 -f "uvicorn.*app.main:app" 2>/dev/null || true
    sleep 1
fi

# Verify port 8000 is now free (or at least backend processes are gone)
BACKEND_KILLED=false
for i in {1..3}; do
    if ! pgrep -f "uvicorn.*app.main:app" >/dev/null 2>&1; then
        echo "✅ Backend processes cleared"
        BACKEND_KILLED=true
        break
    fi
    echo "⏳ Backend still running, retrying... ($i/3)"
    pkill -9 -f "uvicorn.*app.main:app" 2>/dev/null || true
    sleep 2
done

# Final check: if port 8000 is still in use by Python, force kill
if lsof -ti:8000 >/dev/null 2>&1; then
    PORT_PROCS=$(lsof -i:8000 2>/dev/null || true)
    if echo "$PORT_PROCS" | grep -qE "(Python|uvicorn)"; then
        echo "⚠️  Port 8000 still has Python processes, force killing..."
        lsof -ti:8000 | while read pid; do
            if ps -p $pid -o comm= 2>/dev/null | grep -qE "(Python|python)"; then
                kill -9 $pid 2>/dev/null || true
            fi
        done
    else
        echo "ℹ️  Port 8000 is used by non-Python process (probably safe to continue)"
    fi
fi

# 2. Start backend in background
echo "🚀 Starting backend server..."
cd "$BACKEND_DIR/backend" || exit 1

# Clear old log to make debugging easier
> "$SCRIPT_DIR/logs/backend.log"

# Enable detailed cache logging for performance analysis
export ENABLE_CACHE_LOGGING=1

nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_DIR/backend.pid"
echo "✅ Backend starting with ENABLE_CACHE_LOGGING=1 (PID: $BACKEND_PID)"

# Wait for backend to be responsive
echo "⏳ Waiting for backend to be ready..."
BACKEND_READY=false
for i in {1..30}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        BACKEND_READY=true
        echo "✅ Backend is ready and responding!"
        break
    fi
    sleep 1
    if [ $((i % 5)) -eq 0 ]; then
        echo "   Still waiting... ($i/30 seconds)"
    fi
done

if [ "$BACKEND_READY" = false ]; then
    echo "❌ Backend failed to start within 30 seconds"
    echo "📋 Recent backend logs:"
    tail -20 "$SCRIPT_DIR/logs/backend.log"
    echo ""
    echo "💡 Try running manually: cd $BACKEND_DIR/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi

cd "$SCRIPT_DIR"

# 3. Build frontend
echo "🔨 Building frontend web app..."
npm run build
echo "✅ Frontend built"

# Clean up previous iOS builds to avoid xcodebuild errors
if [ -d "ios/App/build" ]; then
    echo "🧹 Cleaning up previous iOS build artifacts..."
    rm -rf ios/App/build
fi

# 4. Sync to Mobile
echo "📱 Syncing to Android & iOS..."
npx cap sync android
npx cap sync ios
echo "✅ Synced to mobile platforms"

# 5. Check emulator status and start if needed
echo "📱 Checking emulator status..."

# Check if emulator is already running
EMULATOR_RUNNING=false
EMULATOR_READY=false

if adb devices | grep -q "emulator"; then
    EMULATOR_RUNNING=true
    echo "✅ Emulator is already running"
    
    # Check if it's fully booted
    echo "⏳ Verifying emulator is ready..."
    adb wait-for-device
    
    boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
    if [ "$boot_completed" = "1" ]; then
        EMULATOR_READY=true
        echo "✅ Emulator is fully booted and ready!"
    else
        echo "⚠️  Emulator is running but not fully booted yet, waiting..."
        # Wait for boot completion
        for i in {1..30}; do
            boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
            if [ "$boot_completed" = "1" ]; then
                EMULATOR_READY=true
                echo "✅ Emulator is now ready!"
                break
            fi
            sleep 2
            if [ $((i % 5)) -eq 0 ]; then
                echo "   Waiting for boot to complete... ($i/30)"
            fi
        done
    fi
fi

# Start emulator only if not running or not ready
if [ "$EMULATOR_READY" = false ]; then
    if [ "$EMULATOR_RUNNING" = false ]; then
        echo "🤖 Starting Android emulator (visible)..."
    else
        echo "⚠️  Emulator not ready, attempting restart..."
    fi
    
    # Find emulator path
    EMULATOR_PATH=$(which emulator 2>/dev/null || true)
    
    if [ -z "$EMULATOR_PATH" ]; then
        # Try common Android SDK locations
        if [ -f "$HOME/Library/Android/sdk/emulator/emulator" ]; then
            EMULATOR_PATH="$HOME/Library/Android/sdk/emulator/emulator"
            echo "ℹ️  Found emulator at: $EMULATOR_PATH"
        elif [ -n "$ANDROID_HOME" ] && [ -f "$ANDROID_HOME/emulator/emulator" ]; then
            EMULATOR_PATH="$ANDROID_HOME/emulator/emulator"
            echo "ℹ️  Found emulator at: $EMULATOR_PATH"
        else
            echo "❌ Error: emulator not found. Please ensure Android SDK is installed."
            echo "   Searched locations:"
            echo "   - PATH (which emulator)"
            echo "   - $HOME/Library/Android/sdk/emulator/emulator"
            echo "   - \$ANDROID_HOME/emulator/emulator"
            echo ""
            echo "📱 Build is complete. To deploy manually:"
            echo "   1. Start Android emulator from Android Studio"
            echo "   2. Run: cd $SCRIPT_DIR/android && ./gradlew installDebug"
            echo "   3. Launch: adb shell am start -n com.bowlingcoach.webapp/.MainActivity"
            exit 0
        fi
    fi
    
    # List available AVDs
    AVDS=$("$EMULATOR_PATH" -list-avds)
    if [ -z "$AVDS" ]; then
        echo "❌ No AVDs found. Please create an AVD in Android Studio first."
        echo ""
        echo "📱 Build is complete. To deploy manually:"
        echo "   1. Create an AVD in Android Studio"
        echo "   2. Start the emulator"
        echo "   3. Run: cd $SCRIPT_DIR/android && ./gradlew installDebug"
        echo "   4. Launch: adb shell am start -n com.bowlingcoach.webapp/.MainActivity"
        exit 0
    fi
    
    # Try to use cbcoaching_arm first, otherwise use first available AVD
    AVD_NAME="cbcoaching_arm"
    if ! echo "$AVDS" | grep -q "^$AVD_NAME$"; then
        AVD_NAME=$(echo "$AVDS" | head -1)
        echo "ℹ️  cbcoaching_arm not found, using: $AVD_NAME"
    fi
    
    # Create logs directory for emulator output
    mkdir -p "$SCRIPT_DIR/logs"
    
    # Start emulator in background but with visible window
    echo "🚀 Starting emulator with: $EMULATOR_PATH -avd $AVD_NAME"
    "$EMULATOR_PATH" -avd "$AVD_NAME" -no-snapshot-load > "$SCRIPT_DIR/logs/emulator.log" 2>&1 &
    EMULATOR_PID=$!
    echo "✅ Emulator started (PID: $EMULATOR_PID)"
    
    echo "⏳ Waiting for emulator to boot (this may take 30-60 seconds)..."
    # Wait for emulator to be listed
    for i in {1..60}; do
        if adb devices | grep -q "emulator"; then
            break
        fi
        sleep 2
        if [ $((i % 5)) -eq 0 ]; then
            echo "   Still waiting for emulator to appear... ($((i*2))/120 seconds)"
        fi
    done
    
    if ! adb devices | grep -q "emulator"; then
        echo "❌ Emulator failed to start within 120 seconds"
        echo "📋 Check emulator logs: tail -f $SCRIPT_DIR/logs/emulator.log"
        exit 1
    fi
    
    # Wait for emulator to be fully booted
    echo "⏳ Waiting for emulator to be ready..."
    adb wait-for-device
    
    # Additional wait for boot completion
    for i in {1..30}; do
        boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
        if [ "$boot_completed" = "1" ]; then
            echo "✅ Emulator is ready!"
            break
        fi
        sleep 2
        if [ $((i % 5)) -eq 0 ]; then
            echo "   Waiting for boot to complete... ($i/30)"
        fi
    done
fi

# 6. Setup ADB reverse port forwarding for backend connection
echo "🔌 Setting up port forwarding..."
if adb reverse tcp:8000 tcp:8000 >/dev/null 2>&1; then
    echo "✅ Port 8000 forwarded (device can connect to localhost:8000)"
else
    echo "⚠️  Failed to setup port forwarding, but continuing..."
fi

# 7. Build and deploy app
echo "🔨 Building and deploying APK..."
cd android || exit 1

if ./gradlew installDebug --no-daemon; then
    echo "✅ APK built and installed successfully"
    
    # Start the app on the emulator
    echo "🚀 Launching app on emulator..."
    if adb shell am start -n com.bowlingcoach.webapp/.MainActivity; then
        echo "✅ App launched successfully"
    else
        echo "⚠️  Failed to launch app, but build was successful"
    fi
else
    echo "❌ Build failed. Check gradle output above."
    exit 1
fi

# 8. Build and deploy iOS App (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 Starting iOS Deployment..."
    cd "$SCRIPT_DIR"
    
    # Check for Xcode tools
    if ! command -v xcrun &> /dev/null; then
        echo "⚠️  xcrun not found. Skipping iOS deployment."
    else
        # Find a Simulator
        echo "🔍 Looking for iPhone simulator..."
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | grep -v "SE" | sort -r | head -n 1 | awk -F '[()]' '{print $2}')
        
        if [ -z "$SIMULATOR_ID" ]; then
            SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | awk -F '[()]' '{print $2}')
        fi
        
        if [ -n "$SIMULATOR_ID" ]; then
            SIMULATOR_NAME=$(xcrun simctl list devices available | grep "$SIMULATOR_ID" | head -n 1 | awk -F '(' '{print $1}' | xargs)
            echo "📱 Found Simulator: $SIMULATOR_NAME ($SIMULATOR_ID)"
            
            # Boot Simulator
            echo "🚀 Booting simulator..."
            xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || echo "   Simulator already booted"
            open -a Simulator
            
            # Build iOS App
            echo "🔨 Building iOS App (check logs/ios-build.log)..."
            cd "$SCRIPT_DIR/ios/App"
            
            # Build using xcodebuild
            if xcodebuild -workspace App.xcworkspace \
                       -scheme App \
                       -destination "platform=iOS Simulator,id=$SIMULATOR_ID" \
                       -configuration Debug \
                       -derivedDataPath build \
                       clean build \
                       CODE_SIGNING_ALLOWED=NO > "$SCRIPT_DIR/logs/ios-build.log" 2>&1; then
                
                echo "✅ iOS App built successfully"
                
                APP_PATH="$SCRIPT_DIR/ios/App/build/Build/Products/Debug-iphonesimulator/App.app"
                
                if [ -d "$APP_PATH" ]; then
                    echo "📲 Installing App on Simulator..."
                    xcrun simctl install "$SIMULATOR_ID" "$APP_PATH"
                    
                    echo "🚀 Launching iOS App..."
                    xcrun simctl launch "$SIMULATOR_ID" "com.bowlingcoach.webapp"
                    echo "✅ iOS App Launched!"
                else
                    echo "❌ App bundle not found at expected path"
                fi
            else
                echo "❌ iOS Build failed. Check logs: $SCRIPT_DIR/logs/ios-build.log"
            fi
            
            cd "$SCRIPT_DIR"
        else
            echo "⚠️  No iPhone simulator found. Skipping iOS deployment."
        fi
    fi
fi

echo ""
echo "================================================"
echo "✅ RESTART COMPLETE - ALL SERVICES RUNNING!"
echo "================================================"
echo ""
echo "🌐 Service URLs:"
echo "   Backend API:     http://localhost:8000"
echo "   Backend Health:  http://localhost:8000/health"
echo "   API Docs:        http://localhost:8000/docs"
echo "   Emulator API:    http://10.0.2.2:8000 (from emulator)"
echo ""
echo "📱 App Status:"
echo "   Android: Deployed to emulator and running"
echo "   iOS:     Deployed to simulator and running (if on macOS)"
echo "   Package: com.bowlingcoach.webapp"
echo ""
echo "📋 View Logs:"
echo "   Backend:   tail -f $SCRIPT_DIR/logs/backend.log"
echo "   Emulator:  tail -f $SCRIPT_DIR/logs/emulator.log"
echo "   iOS Build: tail -f $SCRIPT_DIR/logs/ios-build.log"
echo "   App Logs:  adb logcat | grep -E '(bowlingcoach|Console)'"
echo ""
echo "🔍 Check Status:"
echo "   Backend:   curl http://localhost:8000/health"
echo "   Emulator:  adb devices"
echo "   iOS Sim:   xcrun simctl list devices booted"
echo "   Processes: ps aux | grep -E 'uvicorn|emulator'"
echo ""
echo "🔄 Quick Commands:"
echo "   Restart Android: adb shell am start -n com.bowlingcoach.webapp/.MainActivity"
echo "   Restart iOS:     xcrun simctl launch booted com.bowlingcoach.webapp"
echo "   View app logs:   adb logcat -c && adb logcat | grep -E '(bowlingcoach|Console)'"
echo "   Stop backend:    kill \$(cat $BACKEND_DIR/backend.pid)"
echo ""

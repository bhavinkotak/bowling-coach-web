#!/bin/bash

# Exit on error
set -e

echo "🍎 Starting iOS Setup..."

# Check for Xcode tools
if ! command -v xcrun &> /dev/null; then
    echo "❌ Error: xcrun not found. Please install Xcode and Command Line Tools."
    echo "   Try running: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
    exit 1
fi

# Go to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Build Web Assets
echo "📦 Building web assets..."
npm run build

# 2. Sync Capacitor
echo "🔄 Syncing to iOS..."
npx cap sync ios

# 3. Find a Simulator
echo "🔍 Looking for iPhone simulator..."
# Get the ID of the first available iPhone (preferring newer ones)
SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | grep -v "SE" | sort -r | head -n 1 | awk -F '[()]' '{print $2}')

if [ -z "$SIMULATOR_ID" ]; then
    # Fallback to any iPhone
    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | awk -F '[()]' '{print $2}')
fi

if [ -z "$SIMULATOR_ID" ]; then
    echo "❌ No iPhone simulator found. Please install one via Xcode."
    exit 1
fi

SIMULATOR_NAME=$(xcrun simctl list devices available | grep "$SIMULATOR_ID" | head -n 1 | awk -F '(' '{print $1}' | xargs)
echo "📱 Found Simulator: $SIMULATOR_NAME ($SIMULATOR_ID)"

# 4. Boot Simulator
echo "🚀 Booting simulator..."
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || echo "   Simulator already booted"
open -a Simulator

# 5. Build iOS App
echo "🔨 Building iOS App (this may take a while)..."
cd ios/App

# Build using xcodebuild
# We use a local build directory to easily find the .app file
xcodebuild -workspace App.xcworkspace \
           -scheme App \
           -destination "platform=iOS Simulator,id=$SIMULATOR_ID" \
           -configuration Debug \
           -derivedDataPath build \
           clean build \
           CODE_SIGNING_ALLOWED=NO | xcbeautify 2>/dev/null || true

# 6. Install and Launch
echo "📲 Installing App..."
APP_PATH="$SCRIPT_DIR/ios/App/build/Build/Products/Debug-iphonesimulator/App.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ Build failed. Could not find App.app at $APP_PATH"
    echo "   Please check the xcodebuild output above."
    exit 1
fi

echo "   Installing bundle..."
xcrun simctl install "$SIMULATOR_ID" "$APP_PATH"

echo "🚀 Launching App..."
# Get Bundle ID from Info.plist or assume default
BUNDLE_ID="com.bowlingcoach.webapp"
xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID"

echo "✅ iOS App Started!"
echo "   Backend URL: http://127.0.0.1:8000 (accessible from Simulator)"

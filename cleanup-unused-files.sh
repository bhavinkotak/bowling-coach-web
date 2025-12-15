#!/bin/bash

##############################################
# Cleanup Unused Files - Bowling Coach Web
# Removes 72KB of unused code
##############################################

set -e  # Exit on error

echo "🧹 Cleaning up unused files..."
echo "================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Backup first (optional - comment out if you don't want backups)
echo "📦 Creating backup..."
mkdir -p .cleanup-backup
cp -r src/pages/UploadPage.tsx .cleanup-backup/ 2>/dev/null || true
cp -r src/pages/UploadPage.tsx.backup .cleanup-backup/ 2>/dev/null || true
cp -r src/examples .cleanup-backup/ 2>/dev/null || true
cp -r src/theme .cleanup-backup/ 2>/dev/null || true
cp src/assets/react.svg .cleanup-backup/ 2>/dev/null || true
cp src/App.css .cleanup-backup/ 2>/dev/null || true
echo "✅ Backup created in .cleanup-backup/"
echo ""

# Remove unused pages
echo "🗑️  Removing unused pages..."
if [ -f "src/pages/UploadPage.tsx" ]; then
    rm src/pages/UploadPage.tsx
    echo "  ✅ Removed: src/pages/UploadPage.tsx (20KB)"
else
    echo "  ⏭️  Already removed: src/pages/UploadPage.tsx"
fi

if [ -f "src/pages/UploadPage.tsx.backup" ]; then
    rm src/pages/UploadPage.tsx.backup
    echo "  ✅ Removed: src/pages/UploadPage.tsx.backup (24KB)"
else
    echo "  ⏭️  Already removed: src/pages/UploadPage.tsx.backup"
fi
echo ""

# Remove examples directory
echo "🗑️  Removing examples directory..."
if [ -d "src/examples" ]; then
    rm -rf src/examples
    echo "  ✅ Removed: src/examples/ (8KB)"
else
    echo "  ⏭️  Already removed: src/examples/"
fi
echo ""

# Remove theme directory
echo "🗑️  Removing unused theme directory..."
if [ -d "src/theme" ]; then
    rm -rf src/theme
    echo "  ✅ Removed: src/theme/ (8KB)"
else
    echo "  ⏭️  Already removed: src/theme/"
fi
echo ""

# Remove unused assets
echo "🗑️  Removing unused assets..."
if [ -f "src/assets/react.svg" ]; then
    rm src/assets/react.svg
    echo "  ✅ Removed: src/assets/react.svg (8KB)"
else
    echo "  ⏭️  Already removed: src/assets/react.svg"
fi
echo ""

# Remove unused CSS
echo "🗑️  Removing unused CSS..."
if [ -f "src/App.css" ]; then
    rm src/App.css
    echo "  ✅ Removed: src/App.css (4KB)"
else
    echo "  ⏭️  Already removed: src/App.css"
fi
echo ""

# Clean up empty assets directory if it exists and is empty
if [ -d "src/assets" ] && [ -z "$(ls -A src/assets)" ]; then
    rmdir src/assets
    echo "  ✅ Removed empty: src/assets/"
fi

echo "================================"
echo "✨ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Removed ~72KB of unused code"
echo "  - Backup saved in .cleanup-backup/"
echo ""
echo "🔍 Next steps:"
echo "  1. Run: npm run build"
echo "  2. Run: npm run dev"
echo "  3. Test the application"
echo "  4. If all good, delete .cleanup-backup/"
echo ""
echo "⚠️  To restore files:"
echo "  cp -r .cleanup-backup/* ./"
echo ""

#!/usr/bin/env bash
# ==============================================================================
# Rewind POS - Fast 10-Second Update Script
# Usage: ./update.sh
# ==============================================================================

set -e

echo "☕ [Rewind POS] Pulling latest updates from GitHub..."
cd "$(dirname "$0")"

git pull origin main

echo "🔨 Rebuilding application..."
npm install
npm run build

# Refresh static folders in standalone directory
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

echo "🔄 Zero-downtime PM2 reload..."
pm2 reload rewind-pos

echo "✅ Updated successfully!"
pm2 status

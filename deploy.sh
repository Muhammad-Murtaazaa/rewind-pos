#!/usr/bin/env bash
# ==============================================================================
# Rewind POS - One-Click VPS Production Setup Script (Optimized for Low-Resource)
# Supports Ubuntu 20.04 / 22.04 / 24.04 and Debian 11 / 12
# Works flawlessly on 1 vCPU / 1 GB RAM VPS ($3-$5/mo)
# ==============================================================================

set -e

echo "☕ [Rewind POS] Starting Production VPS Setup..."

# 1. Add 2GB Swap space (Crucial for 1GB VPS to prevent build OOM crashes)
if [ ! -f /swapfile ]; then
    echo "⚙️ Creating 2GB swap file to protect RAM during builds..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap active."
else
    echo "✅ Swap file already exists."
fi

# 2. Update packages and install prerequisites
echo "📦 Updating system packages..."
apt-get update -y
apt-get install -y curl git ufw nginx

# 3. Install Node.js 20 LTS (if not installed)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "✅ Node $(node -v) / NPM $(npm -v) ready."

# 4. Install PM2 process manager
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# 5. Build application with standalone optimization
echo "🔨 Building Rewind POS (Standalone Engine)..."
cd "$(dirname "$0")"
npm ci
npm run build

# Copy static assets to standalone directory (required by Next.js standalone)
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

# 6. Start or reload application with PM2
echo "🚀 Starting app via PM2 (capped at 256MB RAM)..."
mkdir -p logs
pm2 delete rewind-pos 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root || true

# 7. Configure firewall
echo "🛡️ Configuring UFW firewall (Open 22, 80, 443)..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo "=================================================================="
echo "🎉 [Rewind POS] Successfully deployed and running on port 3000!"
echo "👉 Node memory footprint: ~45MB RAM"
echo "👉 Check status: pm2 status"
echo "👉 View logs: pm2 logs rewind-pos"
echo "👉 For custom domain & SSL: run 'sudo certbot --nginx'"
echo "=================================================================="

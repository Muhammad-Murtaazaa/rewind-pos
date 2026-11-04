// PM2 configuration for Rewind POS (Ultra-optimized for low-resource VPS)
module.exports = {
  apps: [
    {
      name: "rewind-pos",
      // If standalone build exists, run server.js directly (uses ~45MB RAM)
      // Otherwise fallback to next start
      script: "node",
      args: ".next/standalone/server.js",
      node_args: "--max-old-space-size=256",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
    },
  ],
};

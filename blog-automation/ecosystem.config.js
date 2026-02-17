// ============================================
// PM2 Ecosystem Configuration
// ============================================
//
// Start:    pm2 start ecosystem.config.js
// Stop:     pm2 stop blog-automation
// Restart:  pm2 restart blog-automation
// Logs:     pm2 logs blog-automation
// Monitor:  pm2 monit
// Status:   pm2 status
//
// IMPORTANT: Run `npm run build` before starting with PM2,
// since PM2 runs the compiled JS from dist/.
// ============================================

module.exports = {
  apps: [
    {
      // ── Main scheduler daemon ─────────────────────────────────
      name: 'blog-automation',
      script: './dist/index.js',
      cwd: __dirname,

      // Node.js options
      node_args: '--max-old-space-size=512',

      // Environment variables (can be overridden per-environment)
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },

      // ── Auto-restart ────────────────────────────────────────
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',        // Consider crashed if dies within 10s
      restart_delay: 5000,       // Wait 5s between restarts

      // ── Memory limits ───────────────────────────────────────
      max_memory_restart: '500M', // Restart if memory exceeds 500 MB

      // ── Logging ─────────────────────────────────────────────
      // PM2 manages its own log files alongside Winston's logs.
      // Set merge_logs to combine cluster logs into one file.
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_type: 'json',

      // Rotate logs at 10 MB (requires pm2-logrotate module)
      // Install: pm2 install pm2-logrotate
      // Configure: pm2 set pm2-logrotate:max_size 10M
      //            pm2 set pm2-logrotate:retain 7
      //            pm2 set pm2-logrotate:compress true

      // ── Graceful shutdown ───────────────────────────────────
      kill_timeout: 65000,        // Wait up to 65s for graceful stop
      listen_timeout: 10000,      // Startup timeout
      shutdown_with_message: true, // Send SIGINT first, then SIGTERM

      // ── Clustering (optional) ───────────────────────────────
      // For this cron-based app a single instance is recommended.
      // Set instances > 1 only if you split work across processes.
      instances: 1,
      exec_mode: 'fork',

      // ── Cron restart (optional) ─────────────────────────────
      // Restart the process daily at 1 AM to clean up memory leaks.
      // cron_restart: '0 1 * * *',
    },
  ],
};

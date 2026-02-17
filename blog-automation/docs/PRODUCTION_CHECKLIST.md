# Production Checklist

Use this checklist before deploying the Blog Automation System to production.

---

## 1. Environment Variables

- [ ] `ANTHROPIC_API_KEY` — Set to a valid key (starts with `sk-ant-`)
- [ ] `DATABASE_URL` — Points to the production PostgreSQL database
- [ ] `WEBSITE_TYPE` — Set to `wordpress`, `custom`, or `static`
- [ ] `WEBSITE_API_URL` — Set to the production CMS API endpoint
- [ ] `WEBSITE_API_KEY` — Set to valid CMS credentials
- [ ] `WP_USERNAME` / `WP_APP_PASSWORD` — Set if using WordPress
- [ ] `GIT_REPO_URL` / `GIT_TOKEN` — Set if using static site deployment
- [ ] `PUBLISH_DRY_RUN` — Set to `false` for production
- [ ] `NODE_ENV` — Set to `production`
- [ ] `LOG_LEVEL` — Set to `info` (or `warn` for less noise)
- [ ] `HEALTH_CHECK_PORT` — Verified not to conflict with other services

## 2. Database

- [ ] PostgreSQL is running and accessible
- [ ] Migrations are applied: `npx prisma migrate deploy`
- [ ] Prisma client is generated: `npx prisma generate`
- [ ] Connection pooling is configured (if using a managed DB)
- [ ] Database backups are scheduled (daily recommended)
- [ ] Database user has correct permissions (CREATE, SELECT, INSERT, UPDATE, DELETE)

## 3. API Rate Limits

- [ ] Anthropic API plan supports the expected call volume
- [ ] Rate limit settings match your plan:
  - Free tier: ~40 req/min, ~1M tokens/day
  - Pro tier: Higher limits — check console.anthropic.com
- [ ] Expected daily usage:
  - 2 posts/day × ~4 API calls/post = ~8 Claude calls/day
  - Topic refresh: ~1-2 calls every few days
  - **Total: ~10-15 API calls/day**

## 4. Cost Estimation

| Component | Monthly Cost (2 posts/day) |
|---|---|
| Anthropic API (Claude Sonnet 4) | ~$6 – $12 |
| PostgreSQL (managed, small) | $5 – $25 |
| Server (VPS / DigitalOcean) | $5 – $12 |
| Domain + SSL | $0 – $15 |
| **Total** | **~$16 – $64/month** |

## 5. Monitoring

- [ ] Health check endpoint is accessible: `GET /health`
- [ ] Status dashboard is accessible: `GET /status`
- [ ] Log files are being written to `logs/` directory
- [ ] Log rotation is configured (PM2: `pm2-logrotate`, Docker: logging driver)
- [ ] Slack webhook URL is set (optional, for alerts)
- [ ] Email alerts are configured (optional)
- [ ] Uptime monitoring is set up (e.g., UptimeRobot, Pingdom)

## 6. Security

- [ ] `.env` file is NOT committed to git
- [ ] `.env` file permissions are restricted: `chmod 600 .env`
- [ ] Database is not exposed to public internet
- [ ] API keys are not logged (verify in `logs/combined.log`)
- [ ] Health check port is firewalled (only accessible internally or via VPN)
- [ ] Node.js runs as a non-root user
- [ ] Dependencies are audited: `npm audit`

## 7. Backup Strategy

### Database Backups

```bash
# Daily automated backup (add to crontab)
0 3 * * * pg_dump $DATABASE_URL | gzip > /backups/blog_automation_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days of backups
find /backups -name "blog_automation_*.sql.gz" -mtime +30 -delete
```

### Application Backups

- [ ] Git repository is the source of truth for code
- [ ] `.env` is backed up securely (not in git)
- [ ] Database is backed up daily
- [ ] Log files are rotated and archived

## 8. Rollback Procedure

### Quick Rollback (PM2)

```bash
# Stop the current version
pm2 stop blog-automation

# Revert to previous git commit
git checkout HEAD~1

# Reinstall and rebuild
npm ci --omit=dev
npm run build

# Restart
pm2 start ecosystem.config.js
```

### Database Rollback

```bash
# Revert the last migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Or restore from backup
psql $DATABASE_URL < /backups/blog_automation_YYYYMMDD.sql
```

### Docker Rollback

```bash
# Tag current image before deploying
docker tag blog-automation:latest blog-automation:previous

# Roll back
docker-compose down
docker tag blog-automation:previous blog-automation:latest
docker-compose up -d
```

## 9. Performance Tuning

- [ ] `MAX_TOKENS` is set appropriately (4096 for most posts)
- [ ] `POSTS_PER_DAY` is within budget (check cost table above)
- [ ] `MIN_POST_SPACING_HOURS` prevents API burst
- [ ] `PUBLISH_TIMEOUT` is reasonable (30s default)
- [ ] PM2 memory limit is set (`max_memory_restart: 500M`)
- [ ] PostgreSQL `max_connections` is sufficient for the pool

## 10. First Run Verification

After deployment, verify these in order:

```bash
# 1. Check configuration
npm run test-connection

# 2. Verify system status
npm run status

# 3. Check health endpoint
curl http://localhost:3000/health

# 4. Generate a test post (dry run first)
PUBLISH_DRY_RUN=true npm run generate

# 5. Review generated content
npm run list

# 6. Seed topics if queue is empty
npm run topics:generate -- 30

# 7. Monitor logs
pm2 logs blog-automation --lines 50
```

## 11. Ongoing Maintenance

| Task | Frequency | Command |
|---|---|---|
| Check system status | Daily | `curl /status` or `npm run status` |
| Review logs for errors | Daily | `pm2 logs blog-automation` |
| Top up topic queue | Weekly | `npm run topics:refresh` |
| Clean old failed posts | Monthly | `npx ts-node scripts/cleanup-old-posts.ts` |
| Database backup verification | Monthly | Restore and test a backup |
| Dependency updates | Monthly | `npm audit`, `npm update` |
| Review generated content | Weekly | Check published posts for quality |
| Rotate API keys | Quarterly | Update in `.env` and restart |

---

*Last updated: 2025*

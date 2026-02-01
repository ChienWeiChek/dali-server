# Verification Guide

## 1. Stack Bring-up

```bash
# Start all services
npm run docker:up
```

**Expected Output:**
- Containers `nginx`, `api`, `web`, `influxdb` start.
- `docker ps` shows all healthy.

## 2. API Health Check

```bash
curl http://localhost/api/health
```

**Expected:** `{"status":"ok"}`

## 3. WebSocket Stream

```bash
# Requires wscat installed globally or via npx
npx wscat -c ws://localhost/ws/devices
```

**Expected:** JSON updates streaming every 5-10s.

## 4. InfluxDB Persistence

```bash
# Check shards
docker compose -f infrastructure/docker-compose.yml exec influxdb influx -database dali_devices -execute 'SHOW SHARDS'
```

**Expected:** List of shards with `monthly` retention policy.

## 5. Dashboard UI

1. Open `http://localhost`.
2. Login with `admin` / `password`.
3. Verify "System Overview" dashboard loads with charts.
4. Go to `/devices` (Device Explorer).
5. Expand "Zone 1".
6. Click a device to see details modal.

## 6. Playwright Automation

```bash
cd apps/dashboard
npx playwright test
```

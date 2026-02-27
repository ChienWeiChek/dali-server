# DALI IoT Dashboard Platform

A Dockerized IoT monitoring solution for DALI lighting controllers, featuring:
- **Fastify API**: High-performance Node.js ingestion service (TypeScript)
- **InfluxDB (1.8 + 2.x)**: Legacy storage plus new stack for Grafana
- **Grafana + React Dashboard**: Real-time monitoring UI (MUI + Tailwind + ECharts)
- **Nginx**: Reverse proxy for unified access

## Prerequisites
- Docker & Docker Compose
- Node.js >= 20.0.0 (for local dev)

## Quick Start

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update .env with your credentials
   ```

2. **Configure Controllers**
   ```bash
   cp config/controllers.json.template config/controllers.json
   # Add your DALI controller IPs and credentials
   ```

3. **Start Stack**
   ```bash
   npm run docker:up
   ```

   - Dashboard: http://localhost
   - API: http://localhost/api
   - InfluxDB 1.8 + Chronograf: http://localhost:8086 / http://localhost:8888
   - InfluxDB 2.x + Grafana: http://localhost:8087 / http://localhost:3001

## Development

```bash
# Install dependencies
npm install

# Start API in dev mode
npm run dev:api

# Start Dashboard in dev mode
npm run dev:web
```

## Architecture

- **Ingestion**: The API service polls configured controllers every 10s and writes to InfluxDB 2.x (legacy 1.8 kept for migration).
- **Real-time**: Device updates are broadcast to the frontend via WebSocket.
- **Persistence**: InfluxDB data is stored in `influxdb-data` (1.8) and `influxdb2-data` (2.x) docker volumes.

## InfluxDB Upgrade Notes

This repo now ships both InfluxDB 1.8/Chronograf and InfluxDB 2.x/Grafana. The 2.x stack starts with the values in `.env` (using `DOCKER_INFLUXDB_INIT_*`).

1. Bring up the stack: `npm run docker:up`.
2. Browse to http://localhost:8087 to confirm InfluxDB 2.x UI and grab the bootstrap token.
3. Log in to Grafana (http://localhost:3001, default admin/grafana) and add an InfluxDB datasource pointing at `http://influxdb2:8086`, using the same token/org/bucket.
4. To migrate existing data from 1.8, use `influxd backup/restore` or export line protocol (`influx_inspect export`) from the `./infrastructure/influx/data` directory and import into the 2.x bucket with `influx write`.
5. Switch the API’s `INFLUX_URL` env to the 2.x endpoint once you are satisfied with migration.

# DALI IoT Dashboard Platform

A Dockerized IoT monitoring solution for DALI lighting controllers, featuring:
- **Fastify API**: High-performance Node.js ingestion service (TypeScript)
- **InfluxDB**: Time-series storage with monthly partitions
- **React Dashboard**: Real-time monitoring UI (MUI + Tailwind + ECharts)
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
   - InfluxDB: http://localhost:8086

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

- **Ingestion**: The API service polls configured controllers every 10s and writes to InfluxDB.
- **Real-time**: Device updates are broadcast to the frontend via WebSocket.
- **Persistence**: InfluxDB data is stored in `influxdb-data` docker volume.

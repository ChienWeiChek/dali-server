# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IoT monitoring platform for DALI lighting controllers. A monorepo with a Fastify API backend, React dashboard frontend, and supporting infrastructure (InfluxDB, MQTT, Nginx).

**Data flow:** Fastify polls DALI controllers via REST + subscribes to MQTT → writes metrics to InfluxDB 2.x → React dashboard queries history + streams real-time updates via WebSocket.

## Commands

### Development
```bash
npm run dev:api          # Start API with tsx watch (port 3000)
npm run dev:web          # Start dashboard Vite dev server
```

### Build
```bash
npm run build:api        # TypeScript compile API
npm run build:web        # TypeScript + Vite build dashboard
```

### Testing & Linting
```bash
npm run test             # Run all tests (Vitest)
npm run test:api         # API tests only
npm run test:web         # Dashboard tests only
npm run lint             # ESLint across all workspaces
```

### Docker
```bash
npm run docker:up        # Build and start full stack
npm run docker:down      # Tear down all containers
npm run docker:logs      # Stream logs from all containers
```

### Utilities
```bash
cd services/api && npm run seed      # Seed sample data into InfluxDB
npm run restore                      # Run database restore script
```

## Architecture

### Monorepo Structure
```
services/api/      Fastify API server
apps/dashboard/    React + Vite SPA
config/            Runtime config (controllers.json, auth.json)
infrastructure/    Docker Compose, Nginx, InfluxDB, Mosquitto configs
docs/              API contract, data model, health check docs
```

### Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| API (Fastify) | 3000 | Polls controllers, ingests MQTT, serves REST + WebSocket |
| Dashboard (Nginx) | 80 | React SPA + reverse proxy to /api |
| InfluxDB 2.x | 8086 | Primary time-series storage |
| MQTT (Mosquitto) | 1883 | Receives device updates from controllers |

### API Key Files
- `services/api/src/server.ts` — Fastify entry point, registers all plugins and routes
- `services/api/src/routes/` — REST endpoints: `devices`, `groups`, `history`, `health`, `mqtt`, `ws`
- `services/api/src/services/influxWriter.ts` — Batched InfluxDB writes
- `services/api/src/services/mqttSubscriber.ts` — MQTT subscription and message handling
- `services/api/src/controllers/daliClient.ts` — HTTP client for DALI device REST API
- `services/api/src/config/loader.ts` — Loads env vars + JSON config files

### Dashboard Key Files
- `apps/dashboard/src/App.tsx` — React Router route definitions
- `apps/dashboard/src/pages/` — Page components (Dashboard, Devices, Device detail)
- `apps/dashboard/src/components/` — Charts (ECharts), tables, modals

### Configuration
- `config/controllers.json` — Array of DALI controller IPs, credentials, polling intervals
- `config/auth.json` — Dashboard admin credentials (bcrypt hashed)
- `.env` — InfluxDB org/bucket/token, MQTT broker URL, port overrides (see `.env.example`)

### InfluxDB Data Model
Measurements are written as `dali_property` with tags for controller, device GUID, and property name. Query via `/api/devices/:guid/history`.


## Tech Stack

**Backend:** Fastify 4, TypeScript 5 (strict), InfluxDB Client, MQTT.js, Axios, Pino logging, Vitest

**Frontend:** React 18, Vite 5, React Router 6, TanStack Query 5, MUI 5, ECharts 5, Tailwind CSS 3

**Infrastructure:** Docker + Compose, Nginx, Node 20-Alpine, Mosquitto 2

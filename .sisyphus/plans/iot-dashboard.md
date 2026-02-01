# IoT Dashboard Platform Work Plan

## TL;DR
> **Objective**: Build an end-to-end IoT monitoring stack for DALI lighting controllers with a Fastify ingestion API, InfluxDB storage (monthly partitions, infinite retention), React + MUI dashboard (real-time + historical views), and Nginx entry, all orchestrated via a single docker-compose suitable for a 2 CPU / 4 GB RAM mini server.
>
> **Deliverables**:
> - Dockerized infrastructure: Nginx reverse proxy, Fastify API, InfluxDB (persistent volumes, retention policy), React dashboard
> - IoT ingestion service polling multiple controllers every 10s (configurable), storing telemetry in InfluxDB
> - WebSocket/SSE channel broadcasting device updates to dashboard
> - React + Vite + MUI + Tailwind CSS + Apache ECharts dashboard (responsive, login, device explorer, real-time metrics, historical charts, alerts)
>
> **Estimated Effort**: Large (multi-component greenfield)
> **Parallel Execution**: YES – 3 waves (infra → backend ingestion → frontend/UI)
> **Critical Path**: Docker/Influx provisioning → Fastify ingestion + data model → WebSocket/API contracts → React dashboard features

---

## Context

### Original Request
- Step 1: Initialize DB and infrastructure for IoT devices (see `properties.md`) using Node.js API server + InfluxDB + React dashboard + Nginx via Docker, TypeScript everywhere, monthly partitions, persistent DB storage.
- Step 2: Authenticate with DALI IoT controllers per `api.md`, poll `/api/bmsapi/dali-devices` + `/api/bmsapi/dali-devices/{guid}` + property endpoints every 10 seconds (configurable), support multiple controllers (credentials array), store telemetry in DB.
- Step 3: Build dashboard (React + MUI) showing device list grouped by zone, pop-up detail card with live telemetry, plus main dashboard view with real-time gauges, historical charts, and alert/status panels.

### Interview Summary
- Deployment: Single `docker-compose.yml` for dev/prod with persistent InfluxDB volumes.
- Config: `controllers.json` for controller credentials (plain text), `auth.json` for dashboard login (simple shared credentials).
- Data retention: Keep all data; partitions are for performance only.
- Polling interval: default 10 seconds, configurable via JSON.
- UI requirements: Multi-page React dashboard (login → overview → device explorer) with WebSocket/SSE-driven live updates; charts via Apache ECharts; Material UI for layout components; device list uses accordion grouped by zone with popup detail modal.
- Testing: Vitest infrastructure planned but tests written after implementation.
- Hardware constraints: 2 CPU, 4 GB RAM mini server; prefer lightweight stack → Fastify chosen over Express.

### Research Findings
- `properties.md` enumerates ~70 possible device metrics across mem banks (light level, power metrics, error counters, temperature, etc.) – required for schema design.
- `api.md` defines login + device list + property endpoints, UI behavior (scroll view, accordion grouping, popup detail).
- InfluxDB best practice: retention policy with `DURATION INF` and `SHARD DURATION 4w` achieves monthly partitions without data loss.
- Fastify + @fastify/websocket is resource-efficient for SSE/WebSocket broadcasting.

### Scope Boundaries
**INCLUDE**
- Docker orchestration for Nginx, Fastify API, InfluxDB, React dashboard (TypeScript)
- InfluxDB bucket + retention policy + schema definitions, persistent volumes
- Fastify API (REST + WebSocket) with scheduler polling multiple controllers via config
- Data ingestion pipeline (controller auth, device enumeration, property polling, Influx writes)
- React + Vite + MUI dashboard (login, responsive main overview, device explorer w/ modal, charts via ECharts; mobile breakpoints supported)
- Configuration + env management (controllers.json, auth.json, .env for secrets)
- Basic Vitest setup (tests added post-implementation)

**EXCLUDE**
- Advanced auth/roles (only shared login)
- Data export/report generation
- Alert notifications (email/SMS)
- Device control commands (read-only dashboard)

---

## Work Objectives

### Core Objective
Deliver a production-ready IoT monitoring platform that continuously ingests DALI controller telemetry into InfluxDB and visualizes device status/metrics in a React dashboard with both real-time and historical insights, deployable via a single docker-compose stack.

### Concrete Deliverables
1. `.sisyphus/` planning artifacts (this plan) + architecture docs describing container topology and data flow
2. `docker-compose.yml`, Dockerfiles (api, web), Nginx config, InfluxDB init scripts, persistent volume mapping
3. Node.js Fastify project (`/services/api`) with TypeScript, controller polling scheduler, Influx client, WebSocket server, config loading, logging
4. React + Vite + TypeScript project (`/apps/dashboard`) styled with MUI + Tailwind CSS, including login, overview dashboard (charts, alerts), device explorer (accordion + modal), WebSocket client
5. Shared TypeScript models describing properties/devices for both API and UI
6. Configuration files: `config/controllers.json`, `config/auth.json`, `.env.example`
7. Basic Vitest config (tests to be added later) + manual verification procedures

### Definition of Done
- `docker compose up -d` succeeds on mini server, services reachable (Nginx:80, API health, React app served)
- Controllers defined in `controllers.json` authenticate, poll, and store sample data in InfluxDB; monthly partitions visible via Influx CLI
- WebSocket/SSE stream pushes device updates to dashboard; UI renders live gauges, chart history via Influx queries, and device list interactions per spec
- Manual verification checklist executed for ingestion, WebSocket updates, dashboard flows
- Basic Vitest setup present (tests may be stubbed but runnable: `npm run test` passes)

### Must Have
- Controller polling resilience (per-controller auth tokens, retry/backoff, logging)
- Monthly partitioned measurements with tags for controller/device/property
- Configurable polling interval + controller list without redeploy
- Secure handling of simple dashboard login (hashed password in config, session tokens)
- WebSocket connection authentication to prevent anonymous data access

### Must NOT Have / Guardrails
- No storing credentials in source control without `.env.example`
- No blocking I/O in polling loop; must support multiple controllers concurrently
- Avoid over-fetching property data (throttle to configured interval, dedupe identical reads)
- Keep container resource usage within hardware limits (use slim base images, restrict Influx cache)
 - Dashboard should not make direct controller calls; only communicate with API
 - Responsive behavior must be tested for key breakpoints (desktop ≥1200px, tablet 768px, mobile 375px)

---

## Verification Strategy

### Test Decision
- Infrastructure currently absent → set up Vitest but write tests after implementation.
- For each deliverable, include manual + automated verification commands (docker-compose, curl, WebSocket scripts, Playwright for UI).
- Acceptance will rely on scripted manual checks plus placeholder Vitest smoke tests.

### Verification by Component
| Component | Verification |
|-----------|--------------|
| Docker stack | `docker compose up -d` + `docker compose logs` for healthy services |
| InfluxDB schema | `docker compose exec influxdb influx bucket list` and `SHOW SHARDS` via CLI |
| API ingestion | `node scripts/mock-controller.ts` (optional) + `curl localhost/api/health` + log inspection |
| Scheduler | CLI script verifying config reload + multi-controller loop |
| WebSocket | `wscat` subscription verifying real-time payloads |
| React dashboard | Playwright scenario hitting login, overview, device list, modal |

Manual QA steps documented under each TODO’s acceptance criteria (no “user manually checks” – provide concrete commands or automation steps).

---

## Execution Strategy

### Parallel Execution Waves
```
Wave 1 (Infra Foundation)
├── Task 1: Repository scaffolding + workspace layout
├── Task 2: Docker compose + Nginx + InfluxDB provisioning
└── Task 3: Shared config + schema definitions

Wave 2 (Backend Ingestion)
├── Task 4: Fastify project setup (API skeleton, config loader)
├── Task 5: Controller auth + polling scheduler + Influx writes
├── Task 6: WebSocket/SSE broadcast channel + REST endpoints

Wave 3 (Frontend Dashboard)
├── Task 7: React app scaffolding + auth flow
├── Task 8: Device explorer UI (list + modal)
├── Task 9: Main dashboard with real-time gauges/charts/alerts

Wave 4 (Ops & QA)
├── Task 10: Vitest setup + baseline tests-after scaffolding
├── Task 11: End-to-end verification scripts + docs
```

### Dependency Matrix (excerpt)
| Task | Depends On | Blocks | Parallelizable |
|------|------------|--------|----------------|
| 1 | - | 4,7 | With 2,3 |
| 2 | 1 | 5,6,7 | Parallel with 3 |
| 3 | 1 | 4,5 | Parallel with 2 |
| 4 | 1,3 | 5,6 | With 7 |
| 5 | 2,4 | 6,9 | Sequential |
| 6 | 2,4,5 | 8,9 | Sequential |
| 7 | 1,2 | 8,9 | Parallel with 4 |
| 8 | 6,7 | 9 | Sequential |
| 9 | 5,6,7,8 | 10,11 | Final UI integration |
| 10 | 4 | 11 | Parallel with 9 |
| 11 | 2-10 | - | Final |

---

## TODOs

> Notes:
> - Recommended agent profiles align with Oh-My-OpenCode categories.
> - References cite specs (`properties.md`, `api.md`) and anticipated new files.
> - Acceptance criteria supply executable commands or Playwright steps.

- [x] **Task 1. Initialize repo structure & tooling**

  **What to do**
  - Create root workspace with `services/api`, `apps/dashboard`, `config`, `infrastructure` directories.
  - Add shared `.editorconfig`, `.gitignore`, `.nvmrc`, `.npmrc` (if needed), README with architecture overview.
  - Decide package manager (use `npm` for simplicity). Initialize root `package.json` with scripts (`npm run dev:api`, `npm run dev:web`, `npm run lint`, `npm run test`).
  - Set up TypeScript configs per project (root `tsconfig.base.json`, project references in API + dashboard).
  - Add `.env.example` capturing required variables (Influx tokens, Fastify port, WebSocket settings, etc.).

  **Must NOT do**
  - Include real credentials in repo
  - Overcomplicate monorepo tooling (no TurboRepo needed unless trivial)

  **Recommended Agent Profile**
  - Category: `unspecified-low` (scaffolding)
  - Skills: none beyond default

  **Parallelization**: Wave 1 (with Tasks 2 & 3)

  **References**
  - `properties.md`, `api.md` (repo root)
  - New files to create: `package.json`, `tsconfig.base.json`, `README.md`

  **Acceptance Criteria**
  - `ls` shows directories: `services/api`, `apps/dashboard`, `config`, `infrastructure`
  - `npm install` (root) succeeds
  - `npx tsc --version` recorded in README prerequisites

- [x] **Task 2. Docker & InfluxDB infrastructure**

  **What to do**
  - Create `infrastructure/docker-compose.yml` orchestrating services: `nginx`, `api`, `web`, `influxdb`
  - Write Dockerfiles: `services/api/Dockerfile` (node:20-alpine), `apps/dashboard/Dockerfile` (node builder + nginx static) or rely on dev server for now
  - Configure InfluxDB container with persistent Named volume (`influxdb-data`), preload admin user/token via env, mount `infrastructure/influx/init.iql` for retention policy + bucket creation (`CREATE RETENTION POLICY monthly ON dali DURATION INF REPLICATION 1 SHARD DURATION 4w DEFAULT`)
  - Nginx: `infrastructure/nginx/nginx.conf` routing `/api/*` → Fastify container, `/ws` → WebSocket, `/` → dashboard static files; enable gzip & caching.
  - Document environment variables in README (INFLUX_TOKEN, CONTROLLER_CONFIG_PATH, etc.)

  **Must NOT do**
  - Use heavy base images (prefer alpine/slim)
  - Expose InfluxDB publicly without authentication

  **Recommended Agent Profile**: `unspecified-high` (infra) — reason: multi-service docker orchestration

  **Parallelization**: Wave 1

  **References**
  - `properties.md` (informs measurement schema)
  - Files to create: `infrastructure/docker-compose.yml`, `infrastructure/influx/init.iql`, `infrastructure/nginx/nginx.conf`, `services/api/Dockerfile`, `apps/dashboard/Dockerfile`

  **Acceptance Criteria**
  - `docker compose -f infrastructure/docker-compose.yml config` succeeds
  - `docker compose up -d` brings up containers (api crashes allowed initially)
  - `docker compose exec influxdb influx bucket list` shows `dali_devices` bucket with monthly shard duration
  - Nginx container proxies `/api/health` to Fastify once API ready

- [x] **Task 3. Configuration & data model definition**

  **What to do**
  - Create `config/controllers.json` template (array of controllers `{ name, ip, username, password, pollingIntervalSec }`)
  - Create `config/auth.json` with dashboard credentials (store password hashed via bcrypt; provide script to generate hash)
  - Define TypeScript interfaces for controller config, device property metadata in `services/api/src/types.ts` (shared via `packages/types` if needed)
  - Document mapping between `properties.md` and Influx measurement schema (e.g., measurement `dali_property`, tags: controller_guid, device_guid, property, mem_bank, units; fields: numeric values)
  - Add JSON schema validation for configs using `zod` or `@sinclair/typebox`

  **Must NOT do**
  - Store plaintext dashboard password (except as env example prior to hashing)

  **Recommended Agent Profile**: `unspecified-low`

  **Parallelization**: Wave 1

  **References**
  - `properties.md` for property list
  - Files: `config/controllers.json`, `config/auth.json`, `services/api/src/types/config.ts`, `docs/data-model.md`

  **Acceptance Criteria**
  - JSON schema validation script `npm run validate:config` passes for sample configs
  - `docs/data-model.md` documents measurement, tags, fields, retention policy

- [x] **Task 4. Fastify API scaffolding**

  **What to do**
  - Initialize `services/api` with Fastify + TypeScript + ESM modules
  - Install deps: `fastify`, `@fastify/websocket`, `@fastify/cors`, `dotenv`, `axios` (for controller calls), `influx`, `pino`
  - Set up entry `src/server.ts`, register routes: `/health`, `/config`, `/ws`
  - Implement configuration loader reading JSON files, watching for changes (fs watch) if feasible
  - Add `npm run dev:api` (ts-node-dev or nodemon) and `npm run build` using `tsc`

  **Must NOT do**
  - Hardcode paths; use env variables with sensible defaults

  **Recommended Agent Profile**: `unspecified-high`

  **Parallelization**: Wave 2 (with Task 7 once TypeScript base ready)

  **References**
  - Files: `services/api/package.json`, `services/api/tsconfig.json`, `services/api/src/server.ts`
  - Spec: `api.md` for endpoints

  **Acceptance Criteria**
  - `npm run dev:api` serves `/health` returning `{ status: "ok" }`
  - `npm run build && npm start` works inside API container
  - `npm run lint` (ESLint) passes

- [x] **Task 5. Controller auth + polling scheduler + Influx writers**

  **What to do**
  - Implement authentication client hitting `http://<controller>/auth/login`, storing `authHeader` per controller with expiry/refresh logic
  - Detect expired/invalid controller tokens automatically (401/419 responses or network errors), trigger re-login, and retry pending device/property fetches without losing data
  - Build polling worker: every `pollingIntervalSec` (default 10s) fetch `/api/bmsapi/dali-devices`, iterate devices, fetch `/api/bmsapi/dali-devices/{guid}` and necessary properties (`/property/{property}/active` or `/last` as configured)
  - Map results into Influx write API (batch writes, up to 5k points) with measurement per property, tags & fields per schema
  - Handle multiple controllers concurrently (Promise.all with concurrency limit to avoid CPU spikes)
  - Add resilience: retries with exponential backoff, logging, metrics counters (success/failure) stored in Influx or Prometheus-style metrics endpoint `/metrics`

  **Must NOT do**
  - Block event loop with sync calls
  - Lose data on temporary Influx failures (queue + retry)

  **Recommended Agent Profile**: `unspecified-high`

  **Parallelization**: Wave 2 (after Task 4, with Task 6 once data contract ready)

  **References**
  - `api.md` (controller endpoints)
  - `properties.md` (property metadata)
  - Files: `services/api/src/controllers/daliClient.ts`, `services/api/src/services/poller.ts`, `services/api/src/services/influxWriter.ts`

  **Acceptance Criteria**
  - Run `npm run dev:api` with mock controllers → logs show polling cycle + Influx write success
  - `docker compose exec influxdb influx query 'import "influxdata/influxdb/schema"; schema.tagValues(bucket:"dali_devices", measurement:"dali_property", tag:"property")'` lists expected properties
  - API exposes `/metrics` summarizing polling stats

- [x] **Task 6. REST/WS endpoints for dashboard**

  **What to do**
  - Implement REST endpoints: `/api/devices` (latest metadata from Influx + config), `/api/devices/:guid/history?property=` (query Influx for time range), `/api/alerts` (derive error flags)
  - Implement WebSocket or Server-Sent Events route `/ws/devices` streaming updates each polling cycle (per device/property)
  - Include authentication middleware verifying dashboard login session/token before giving access to data
  - Provide DTO mappers to shape raw Influx data into UI-friendly objects (units, formatting)
  - Document API contract in `docs/api-contract.md`

  **Must NOT do**
  - Leak controller credentials in API responses

  **Recommended Agent Profile**: `unspecified-high`

  **Parallelization**: Wave 2 (after Task 5; required before Task 8/9)

  **References**
  - `api.md` UI behavior specs
  - Files: `services/api/src/routes/devices.ts`, `services/api/src/routes/history.ts`, `services/api/src/routes/ws.ts`

  **Acceptance Criteria**
  - `curl localhost/api/devices` returns grouped devices (per zone) in <500ms
  - `wscat -c ws://localhost/ws/devices` receives payloads at ~10s interval
  - Auth-protected: hitting endpoint without session returns 401

- [ ] **Task 7. React app scaffolding + auth flow**

  **What to do**
  - Create Vite + React + TypeScript project under `apps/dashboard`
  - Install deps: `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@tanstack/react-query`, `axios`, `react-router-dom`, `echarts`, `echarts-for-react`, WebSocket client (native or libs), `tailwindcss`, `postcss`, `autoprefixer`
  - Build routing: `/login`, `/dashboard`, `/devices`
  - Implement simple auth form (dashboard-only credentials). On submit, call API `/auth/login` storing JWT/session cookie.
  - Implement ProtectedRoute component enforcing login before main views.
  - Establish responsive layout primitives (MUI theme + Tailwind utility classes for spacing/grid) including Drawer/bottom navigation on mobile.

  **Must NOT do**
  - Store password in localStorage (use httpOnly cookies or memory/React Query)

  **Recommended Agent Profile**: `visual-engineering` + skill `frontend-ui-ux`

  **Parallelization**: Wave 2, can start once Task 4 (API skeleton) is available

  **References**
  - `api.md` Step 1 login page guidelines
  - Files: `apps/dashboard/src/App.tsx`, `apps/dashboard/src/pages/Login.tsx`, `apps/dashboard/src/routes.tsx`

  **Acceptance Criteria**
  - `npm run dev:web` launches Vite dev server
  - Login form validates required fields, handles 401 gracefully
  - After login, user redirected to `/dashboard`
  - Responsive layout verified using Chrome devtools device sizes (desktops ≥1200px, tablet 768px, mobile 390px)

- [x] **Task 8. Device explorer UI (list + modal)**

  **What to do**
  - Create device list page replicating `api.md` Step 2 requirements: window-height scrollable list, accordion grouped by zone, items show key metadata (title, type, properties summary)
  - On item click, open modal/popup showing details from `/api/devices/:guid` plus property list; allow selecting property to fetch latest value via WebSocket or fallback REST
  - Include search/filter by zone/title/property
  - Modal adapts to mobile (full-screen) while accordion collapses into stacked list
  - Use React Query for caching + polling fallback if WS unavailable

  **Must NOT do**
  - Perform direct controller fetches from frontend

  **Recommended Agent Profile**: `visual-engineering` + skill `frontend-ui-ux`

  **Parallelization**: Wave 3 (depends on Task 6 API)

  **References**
  - `api.md` Step 2 & Step 3 UI spec
  - Files: `apps/dashboard/src/pages/Devices.tsx`, `apps/dashboard/src/components/DeviceAccordion.tsx`, `DeviceModal.tsx`

  **Acceptance Criteria**
  - Playwright script (see Verification) confirms accordion grouping + modal data retrieval
  - Additional Playwright viewport checks (390x844) ensure mobile usability
  - WebSocket updates reflected in modal without manual refresh

- [x] **Task 9. Main dashboard (gauges, charts, alerts)**

  **What to do**
  - Layout summary cards (total devices online/offline, error counts) using responsive MUI Grid (cols adjust 4/6/12)
  - Implement real-time gauges (e.g., average light level, power consumption) using ECharts gauge
  - Historical charts: line chart for driverInputPower vs time, area chart for temperature, stacked bar for error counts; fetch data via API history endpoint (influx query for last 24h/7d) and update via React Query + WebSocket delta updates
  - Alerts panel listing devices with critical flags (lampFailure, errorOverall, emergencyMode)
  - Provide manual time range controls (last 1h, 24h, 7d)
  - Charts degrade gracefully to stacked layout / swipeable carousel on mobile

  **Must NOT do**
  - Query Influx directly from browser (all via API)

  **Recommended Agent Profile**: `visual-engineering` + `frontend-ui-ux`

  **Parallelization**: Wave 3 (after Task 6 + partial Task 8)

  **References**
  - `properties.md` for metric descriptions
  - Files: `apps/dashboard/src/pages/Dashboard.tsx`, `apps/dashboard/src/components/charts/*.tsx`

  **Acceptance Criteria**
  - Playwright scenario ensures gauges react to simulated WebSocket updates
  - Mobile viewport test ensures charts remain legible at 375px width
  - API history request returns data used by charts (verified via React Query devtools or network logs)

- [x] **Task 10. Vitest setup + baseline tests-after scaffolding**

  **What to do**
  - Install `vitest`, `@vitest/coverage-istanbul`, `ts-node`, `supertest` (for API) and configure `vitest.config.ts` in both API & dashboard
  - Add sample tests (config loader, React component snapshot) to ensure pipeline ready for future coverage
  - Integrate with npm scripts (`npm run test`, `npm run test:api`, `npm run test:web`)

  **Must NOT do**
  - Add exhaustive tests now; only scaffolding + sanity tests per “tests after” directive

  **Recommended Agent Profile**: `unspecified-low`

  **Parallelization**: Wave 4 (after Task 4/7 scaffolds)

  **References**
  - Files: `services/api/vitest.config.ts`, `apps/dashboard/vitest.config.ts`, example spec files

  **Acceptance Criteria**
  - `npm run test` (root) executes both projects and passes
  - Coverage report generated (even if minimal)

- [x] **Task 11. Verification scripts + documentation**

  **What to do**
  - Write manual verification checklist in `docs/verification.md` covering docker bring-up, ingestion, dashboard flows, WebSocket test, Influx queries
  - Automate UI verification with Playwright script `apps/dashboard/tests/dashboard.spec.ts` (login, view dashboard, open device detail, confirm WebSocket update). Configure Playwright via `npx playwright install` (optional due to resource constraints; can use headless only)
  - Provide example data seeding script (`services/api/scripts/seedSample.ts`) to populate Influx for demo/testing

  **Must NOT do**
  - Skip documenting failure recovery steps

  **Recommended Agent Profile**: `unspecified-high`

  **Parallelization**: Final wave

  **References**
  - Files: `docs/verification.md`, `apps/dashboard/tests/dashboard.spec.ts`, `services/api/scripts/seedSample.ts`

  **Acceptance Criteria**
  - Verification doc lists commands with expected outputs
  - Playwright test passes via `npx playwright test` (headless)
  - Seed script populates sample data visible on dashboard

---

## Verification Commands (Summary)
```bash
# bring up stack
docker compose -f infrastructure/docker-compose.yml up -d --build

# check service health
curl http://localhost/api/health
curl -i -N http://localhost/ws/devices   # SSE stream

# Influx partition check
docker compose exec influxdb influx query 'SHOW SHARDS'

# API tests
cd services/api && npm run lint && npm run test

# Frontend dev
cd apps/dashboard && npm run dev

# Playwright UI test
cd apps/dashboard && npx playwright test
```

---

## Final Checklist
- [ ] Docker compose stack runs on target hardware
- [ ] InfluxDB retention + shard policy applied (monthly partitions)
- [ ] Fastify API ingests from multiple controllers, writes to Influx
- [ ] WebSocket delivers updates to dashboard
- [ ] React dashboard meets UI requirements (login, device explorer, real-time + historical views)
- [ ] Vitest scaffolding operational (tests-after ready)
- [ ] Verification scripts + docs completed

---

## Next Steps
1. Run `/start-work` to hand this plan to the execution agent.
2. Provide controller credentials + auth settings via `config/controllers.json` & `config/auth.json` before execution.

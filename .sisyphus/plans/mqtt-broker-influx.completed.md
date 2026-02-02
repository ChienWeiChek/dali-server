# MQTT Broker & InfluxDB Data Pipeline

## TL;DR

> **Quick Summary**: Add Mosquitto MQTT broker to the Docker stack, create a TypeScript MQTT subscriber service that listens to DALI-PRO-IoT device data and writes to InfluxDB, replacing the current HTTP polling mechanism.
> 
> **Deliverables**:
> - Mosquitto broker service in docker-compose
> - MQTT subscriber service (`mqttSubscriber.ts`)
> - Updated InfluxDB schema with `category` tag
> - Disabled HTTP poller
> - Environment variables for MQTT credentials
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (Mosquitto) → Task 3 (Subscriber) → Task 5 (Disable Poller) → Task 6 (Verification)

---

## Context

### Original Request
Create MQTT broker and subscribe to `DALI-PRO-IoT/+/devices/+/+/data/#` topic pattern to get IoT data updates and save to InfluxDB.

### Interview Summary
**Key Discussions**:
- **Broker location**: Local Mosquitto in docker-compose
- **Replace HTTP poller**: Yes, MQTT becomes primary data source
- **Payload format**: JSON `{"date": "...", "time": "...", "value": ..., "unit": "..."}`
- **Security**: Username/Password authentication via .env
- **Timestamp**: Use server receive time (not device-reported)
- **Controller tag**: Extract `<device name>` from MQTT topic
- **Category tag**: Yes, add as new InfluxDB tag
- **Error handling**: Log warning and drop malformed messages
- **Testing**: Manual verification (no automated tests)

**Research Findings**:
- Existing `InfluxWriter` with batching (1000 points, 5s flush) - REUSE
- Current measurement `dali_property` with tags: controller, device_guid, property, unit
- Stack: Fastify, TypeScript ESM, Node.js 20+, InfluxDB 1.8

### Metis Review
**Identified Gaps** (addressed):
- Timestamp source → Decided: server receive time
- Controller tag mapping → Decided: extract from topic
- Category as tag → Decided: yes, add it
- Error handling → Decided: log and drop
- Verification approach → Added CLI-based smoke test commands

---

## Work Objectives

### Core Objective
Replace HTTP polling with MQTT subscription for real-time IoT data ingestion from DALI-PRO-IoT devices to InfluxDB.

### Concrete Deliverables
- `infrastructure/docker-compose.yml` - Mosquitto service added
- `infrastructure/mosquitto/` - Config and password files
- `services/api/src/services/mqttSubscriber.ts` - MQTT subscriber service
- `services/api/src/types/config.ts` - MQTT config types
- `services/api/src/config/loader.ts` - MQTT config loading
- `services/api/src/server.ts` - Wire up MQTT subscriber, disable poller
- `.env.example` - MQTT environment variables

### Definition of Done
- [ ] `docker compose up` starts Mosquitto broker on port 1883
- [ ] Publishing to `DALI-PRO-IoT/test/devices/sensors/abc-123/data/temperature` writes point to InfluxDB
- [ ] InfluxDB query returns point with correct tags (controller=test, category=sensors, device_guid=abc-123, property=temperature)
- [ ] HTTP poller no longer runs (no poll cycle logs)

### Must Have
- Mosquitto broker with password authentication
- MQTT subscriber parsing topic structure: `DALI-PRO-IoT/<device>/<devices>/<category>/<guid>/data/<property>`
- JSON payload parsing: `{date, time, value, unit}`
- Write to InfluxDB via existing `InfluxWriter`
- Graceful reconnection on MQTT disconnect

### Must NOT Have (Guardrails)
- NO TLS/cert automation (internal docker network)
- NO durable message queueing or exactly-once semantics
- NO multi-broker failover
- NO new InfluxDB measurements (keep `dali_property`)
- NO bypass of existing `InfluxWriter` batching
- NO WebSocket changes to frontend
- NO automated tests (manual verification only per user request)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (vitest in project)
- **User wants tests**: NO (manual verification)
- **Framework**: N/A

### Automated Verification (Agent-Executable)

Each TODO includes CLI-based verification that agents can run directly.

**By Deliverable Type:**

| Type | Verification Tool | Automated Procedure |
|------|------------------|---------------------|
| **Docker Services** | docker compose + bash | Start stack, check container status |
| **MQTT Broker** | mosquitto_pub/sub CLI | Publish message, verify delivery |
| **InfluxDB Write** | influx CLI | Query for inserted points |
| **Service Logs** | docker logs | Grep for expected/unexpected patterns |

**Evidence Requirements:**
- Command output captured and compared against expected patterns
- Exit codes checked (0 = success)
- InfluxDB query returns expected data

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Add Mosquitto to docker-compose
└── Task 2: Add MQTT config types and loader

Wave 2 (After Wave 1):
├── Task 3: Create MQTT subscriber service
└── Task 4: Install mqtt dependency

Wave 3 (After Wave 2):
└── Task 5: Wire up subscriber, disable poller

Wave 4 (After Wave 3):
└── Task 6: End-to-end verification

Critical Path: Task 1 → Task 3 → Task 5 → Task 6
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 6 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 5 | 4 |
| 4 | None | 5 | 3 |
| 5 | 3, 4 | 6 | None |
| 6 | 5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | `delegate_task(category="quick", load_skills=[], run_in_background=true)` each |
| 2 | 3, 4 | Task 3: `category="unspecified-low"`, Task 4: `category="quick"` |
| 3 | 5 | `category="quick"` |
| 4 | 6 | `category="quick"` |

---

## TODOs

### Task 1: Add Mosquitto Broker to Docker Compose

- [x] 1. Add Mosquitto Broker to Docker Compose
- [x] 2. Add MQTT Configuration Types and Loader

  **What to do**:
  - Add `MqttConfig` interface to `services/api/src/types/config.ts`
  - Add `mqtt` property to `AppConfig` interface
  - Update `services/api/src/config/loader.ts` to load MQTT config from env vars
  - Add MQTT variables to `.env.example`: `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TOPIC`

  **Must NOT do**:
  - Do NOT add TLS config options
  - Do NOT load from separate config file (use env vars only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small TypeScript interface additions and config loading
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `services/api/src/types/config.ts:15-29` - `AppConfig` interface structure (influx, server patterns)
  - `services/api/src/config/loader.ts` - How existing config is loaded from env vars

  **WHY Each Reference Matters**:
  - `types/config.ts` shows the existing pattern for adding new config sections
  - `loader.ts` shows how to read from process.env and construct config objects

  **Acceptance Criteria**:

  ```bash
  # TypeScript compiles without errors
  cd services/api && npx tsc --noEmit
  # Assert: Exit code 0, no type errors

  # Verify .env.example contains new variables
  grep -E "MQTT_(BROKER_URL|USERNAME|PASSWORD|TOPIC)" .env.example
  # Assert: All 4 variables present
  ```

  **Commit**: YES
  - Message: `feat(api): add MQTT configuration types and env loading`
  - Files: `services/api/src/types/config.ts`, `services/api/src/config/loader.ts`, `.env.example`
  - Pre-commit: `cd services/api && npx tsc --noEmit`

---

### Task 3: Create MQTT Subscriber Service

- [ ] 3. Create MQTT Subscriber Service

  **What to do**:
  - Create `services/api/src/services/mqttSubscriber.ts`
  - Implement `MqttSubscriber` class with:
    - Constructor taking `MqttConfig` and `InfluxWriter`
    - `connect()` method to establish MQTT connection
    - `subscribe()` to topic pattern `DALI-PRO-IoT/+/devices/+/+/data/#`
    - Message handler that:
      1. Parses topic: extract `deviceName`, `category`, `guid`, `property`
      2. Parses JSON payload: extract `value`, `unit`
      3. Calls `influxWriter.writePoint()` with correct tags/fields
    - Reconnection logic on disconnect
    - Error logging for malformed messages (log and drop)
  - Use `mqtt` npm package (to be installed in Task 4)

  **Must NOT do**:
  - Do NOT implement durable queueing
  - Do NOT bypass `InfluxWriter` batching (use `writePoint()` not direct writes)
  - Do NOT add new InfluxDB measurements
  - Do NOT store device-reported timestamp (use server time)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Core implementation task, moderate complexity, needs careful MQTT handling
  - **Skills**: `[]`
    - Standard TypeScript, no special UI or git skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `services/api/src/services/poller.ts` - Service class pattern (constructor, start method)
  - `services/api/src/services/influxWriter.ts:25-30` - How to call `writePoint()` with `IPoint`
  - `services/api/src/services/poller.ts:58-72` - Point structure (measurement, tags, fields)

  **API/Type References**:
  - `services/api/src/types/config.ts:AppConfig['mqtt']` - MQTT config interface (after Task 2)
  - `influx` package `IPoint` interface - Point structure for writes

  **External References**:
  - `mqtt` npm package: https://www.npmjs.com/package/mqtt
  - MQTT.js API: https://github.com/mqttjs/MQTT.js#api

  **WHY Each Reference Matters**:
  - `poller.ts` shows the existing service pattern (constructor takes config + influxWriter)
  - `poller.ts:58-72` shows exact `writePoint()` call structure with measurement, tags, fields
  - `mqtt` package docs show `connect()`, `subscribe()`, `on('message')` patterns

  **Topic Parsing Logic**:
  ```
  Topic: DALI-PRO-IoT/<deviceName>/devices/<category>/<guid>/data/<property>
  Example: DALI-PRO-IoT/Controller1/devices/sensors/abc-123-def/data/temperature
  
  Parse result:
  - deviceName: "Controller1" → tag: controller
  - category: "sensors" → tag: category (NEW)
  - guid: "abc-123-def" → tag: device_guid
  - property: "temperature" → tag: property
  ```

  **Payload Parsing Logic**:
  ```json
  {"date": "2026.02.02", "time": "15:20:46", "value": 1524214, "unit": "s"}
  
  Extract:
  - value → field: value_num (if number) or value_str (if string)
  - unit → tag: unit
  - date/time → IGNORE (use server timestamp)
  ```

  **Acceptance Criteria**:

  ```bash
  # TypeScript compiles without errors
  cd services/api && npx tsc --noEmit
  # Assert: Exit code 0

  # File exists and exports MqttSubscriber class
  grep -E "export class MqttSubscriber" services/api/src/services/mqttSubscriber.ts
  # Assert: Match found

  # Class has required methods
  grep -E "(connect|subscribe|handleMessage)" services/api/src/services/mqttSubscriber.ts
  # Assert: All 3 methods present
  ```

  **Commit**: YES
  - Message: `feat(api): create MQTT subscriber service for DALI-PRO-IoT data`
  - Files: `services/api/src/services/mqttSubscriber.ts`
  - Pre-commit: `cd services/api && npx tsc --noEmit`

---

### Task 4: Install MQTT Dependency

- [ ] 4. Install MQTT Dependency

  **What to do**:
  - Install `mqtt` npm package: `npm install mqtt --workspace=services/api`
  - Install types: `npm install -D @types/mqtt --workspace=services/api` (if needed, check if mqtt has built-in types)

  **Must NOT do**:
  - Do NOT install alternative MQTT libraries
  - Do NOT install globally

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single npm install command
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/api/package.json` - Existing dependencies pattern

  **Acceptance Criteria**:

  ```bash
  # Verify mqtt is in dependencies
  grep '"mqtt"' services/api/package.json
  # Assert: Match found

  # Verify package is installed
  ls node_modules/mqtt/package.json
  # Assert: File exists
  ```

  **Commit**: YES (group with Task 3)
  - Message: `chore(api): add mqtt package dependency`
  - Files: `services/api/package.json`, `package-lock.json`
  - Pre-commit: N/A

---

### Task 5: Wire Up MQTT Subscriber and Disable HTTP Poller

- [x] 5. Wire Up MQTT Subscriber and Disable HTTP Poller

  **What to do**:
  - Update `services/api/src/server.ts`:
    - Import `MqttSubscriber`
    - Create `MqttSubscriber` instance with config and `InfluxWriter`
    - Call `mqttSubscriber.connect()` after server starts
    - **Remove or comment out** `PollerService` instantiation and `poller.start()`
  - Verify no hidden dependencies on `PollerService` before removing

  **Must NOT do**:
  - Do NOT delete `poller.ts` file (keep for reference/rollback)
  - Do NOT remove `DaliClient` (might be used elsewhere)
  - Do NOT run both poller and MQTT simultaneously

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small edits to server.ts, mostly import/wire changes
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3)
  - **Blocks**: Task 6
  - **Blocked By**: Task 3, Task 4

  **References**:

  **Pattern References**:
  - `services/api/src/server.ts:22-24` - How `InfluxWriter` and `PollerService` are wired
  - `services/api/src/server.ts:1-9` - Import pattern

  **WHY Each Reference Matters**:
  - `server.ts:22-24` shows where to replace poller with MQTT subscriber
  - Follow same pattern: create instance, call connect/start

  **Pre-removal Check**:
  Use `lsp_find_references` on `PollerService` to ensure no other code depends on it.

  **Acceptance Criteria**:

  ```bash
  # TypeScript compiles
  cd services/api && npx tsc --noEmit
  # Assert: Exit code 0

  # MqttSubscriber is imported
  grep "MqttSubscriber" services/api/src/server.ts
  # Assert: Match found

  # PollerService is NOT started (commented or removed)
  grep -E "poller\.start\(\)" services/api/src/server.ts
  # Assert: No match (line removed or commented)

  # Start server and check logs
  docker compose -f infrastructure/docker-compose.yml up -d api
  sleep 5
  docker compose -f infrastructure/docker-compose.yml logs api 2>&1 | grep -i "mqtt"
  # Assert: Logs show MQTT connection attempt
  docker compose -f infrastructure/docker-compose.yml logs api 2>&1 | grep -i "Starting poller"
  # Assert: No match (poller not starting)
  ```

  **Commit**: YES
  - Message: `feat(api): switch from HTTP polling to MQTT subscription`
  - Files: `services/api/src/server.ts`
  - Pre-commit: `cd services/api && npx tsc --noEmit`

---

### Task 6: End-to-End Verification

- [x] 6. End-to-End Verification

  **What to do**:
  - Start full docker stack
  - Publish test MQTT message using `mosquitto_pub`
  - Query InfluxDB to verify data was written
  - Verify all tags are correct (controller, category, device_guid, property, unit)
  - Document verification results

  **Must NOT do**:
  - Do NOT skip any verification step
  - Do NOT rely on visual UI checks

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CLI commands and verification only
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4 - Final)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `infrastructure/docker-compose.yml` - Service names and ports

  **Acceptance Criteria**:

  ```bash
  # 1) Start full stack
  docker compose -f infrastructure/docker-compose.yml up -d --build
  sleep 10  # Wait for services to initialize

  # 2) Verify all services running
  docker compose -f infrastructure/docker-compose.yml ps --format json | jq -r '.[].State' | sort -u
  # Assert: Only "running" in output

  # 3) Publish test MQTT message
  docker compose -f infrastructure/docker-compose.yml exec mosquitto mosquitto_pub \
    -h localhost -p 1883 \
    -u "${MQTT_USERNAME:-admin}" -P "${MQTT_PASSWORD:-admin123}" \
    -t 'DALI-PRO-IoT/TestController/devices/sensors/test-guid-123/data/temperature' \
    -m '{"date":"2026.02.02","time":"15:20:46","value":21.5,"unit":"C"}'
  # Assert: Exit code 0

  # 4) Wait for batch flush (5 seconds)
  sleep 6

  # 5) Query InfluxDB for the data
  docker compose -f infrastructure/docker-compose.yml exec influxdb influx \
    -database dali_devices \
    -username "${INFLUX_ADMIN_USER:-admin}" -password "${INFLUX_ADMIN_PASSWORD:-admin123}" \
    -execute "SELECT * FROM dali_property WHERE time > now() - 1m AND device_guid = 'test-guid-123' LIMIT 5"
  # Assert: At least 1 row returned with:
  # - controller = TestController
  # - category = sensors
  # - device_guid = test-guid-123
  # - property = temperature
  # - unit = C
  # - value_num = 21.5

  # 6) Verify no poller activity
  docker compose -f infrastructure/docker-compose.yml logs api 2>&1 | grep -c "Starting poller"
  # Assert: Output is "0"

  # 7) Verify MQTT connection success
  docker compose -f infrastructure/docker-compose.yml logs api 2>&1 | grep -i "mqtt.*connected"
  # Assert: Match found
  ```

  **Evidence to Capture**:
  - [ ] InfluxDB query output showing correct data
  - [ ] API logs showing MQTT connected
  - [ ] API logs showing no poller activity

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(infra): add Mosquitto MQTT broker to docker-compose` | docker-compose.yml, mosquitto/* | docker compose config |
| 2 | `feat(api): add MQTT configuration types and env loading` | types/config.ts, loader.ts, .env.example | tsc --noEmit |
| 3+4 | `feat(api): create MQTT subscriber with mqtt package` | mqttSubscriber.ts, package.json | tsc --noEmit |
| 5 | `feat(api): switch from HTTP polling to MQTT subscription` | server.ts | tsc --noEmit |

---

## Success Criteria

### Verification Commands
```bash
# Full E2E test
docker compose -f infrastructure/docker-compose.yml up -d --build
docker compose -f infrastructure/docker-compose.yml exec mosquitto mosquitto_pub \
  -t 'DALI-PRO-IoT/TestController/devices/sensors/test-123/data/power' \
  -m '{"date":"2026.02.02","time":"15:20:46","value":100,"unit":"W"}' \
  -u admin -P admin123
sleep 6
docker compose -f infrastructure/docker-compose.yml exec influxdb influx \
  -database dali_devices -username admin -password admin123 \
  -execute "SELECT * FROM dali_property WHERE device_guid = 'test-123' ORDER BY time DESC LIMIT 1"
# Expected: 1 row with value_num=100, unit=W, property=power, category=sensors, controller=TestController
```

### Final Checklist
- [ ] Mosquitto broker running and accepting connections
- [ ] MQTT subscriber connected and processing messages
- [ ] InfluxDB receiving data with correct schema (controller from topic, category tag added)
- [ ] HTTP poller disabled (no poll cycle logs)
- [ ] Malformed messages logged and dropped (not crashing)
- [ ] Reconnection works on broker restart

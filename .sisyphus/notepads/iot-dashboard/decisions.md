# Decisions
- **Manual Implementation**: Due to missing agent configuration, all tasks were implemented directly by the orchestrator.
- **Poller Architecture**: Implemented a `PollerService` that manages `DaliClient` instances and uses `InfluxWriter` for batching writes.
- **Frontend Stack**: Used Vite + React + MUI + Tailwind + ECharts as planned.
- **Testing**: Added basic Vitest setup and sanity tests. Playwright tests scaffolded but not run (requires browser install).

# Learnings
- **Workspace Management**: npm workspaces require running scripts from root with `--workspace` flag.
- **Fastify & TypeScript**: Need `ts-node` or `tsx` for dev mode to handle ESM imports correctly.
- **InfluxDB 1.8**: Used 1.8 image for simplicity with `influx` package, but client config needs to match legacy auth if enabled.

import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import { loadConfig } from "./config/loader.js";
import { InfluxWriter } from "./services/influxWriter.js";
// import { PollerService } from './services/poller.js';
import { MqttSubscriber } from "./services/mqttSubscriber.js";
import { CacheService } from "./services/cacheService.js";
import { DaliClient } from "./controllers/daliClient.js";
import deviceRoutes from "./routes/devices.js";
import historyRoutes from "./routes/history.js";
import groupsRoutes from "./routes/groups.js";
import healthRoutes from "./routes/health.js";
import metricsRoutes from "./routes/metrics.js";
import mqttRoutes from "./routes/mqtt.js";
import cacheRoutes from "./routes/cache.js";

const start = async () => {
  try {
    const config = await loadConfig();
    const fastify = Fastify({
      logger: {
        transport: {
          target: "pino-pretty",
        },
      },
      // Route-level connection timeout (ms). Heavy queries like /energy/monthly
      // (365-day fan-out) can take well over 10 s on large datasets.
      // Set to 90 s — comfortably above the InfluxDB client's 60 s socket timeout
      // so the DB error surfaces rather than a generic connection drop.
      connectionTimeout: 90_000,
    });

    const influxWriter = new InfluxWriter(config.influx);
    // const poller = new PollerService(config, influxWriter);
    // poller.start();

    const cacheService = new CacheService(config.cache);

    const clients = config.controllers.map((c) => new DaliClient(c));
    const mqttSubscriber = new MqttSubscriber(
      config.mqtt,
      influxWriter,
      clients,
    );
    mqttSubscriber.connect();

    await fastify.register(cors);
    // await fastify.register(websocket);

    // Register routes
    await fastify.register(healthRoutes, {
      mqttSubscriber,
      influxWriter,
      daliClients: clients,
    });
    await fastify.register(deviceRoutes, { daliClients: clients });
    await fastify.register(groupsRoutes, { daliClients: clients });
    await fastify.register(historyRoutes, { cacheService });
    await fastify.register(metricsRoutes, { cacheService });
    await fastify.register(mqttRoutes, { daliClients: clients });

    // Register cache debugging routes if enabled
    const enableCacheDebug =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_CACHE_DEBUG === "true";
    if (enableCacheDebug) {
      await fastify.register(cacheRoutes, { cacheService });
      fastify.log.info("Cache debugging endpoints enabled");
    }

    fastify.get("/api/config", async () => {
      return {
        controllers: config.controllers.length,
        influx: config.influx.url,
      };
    });

    await fastify.listen({ port: config.server.port, host: "0.0.0.0" });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { loadConfig } from './config/loader.js';
import { InfluxWriter } from './services/influxWriter.js';
// import { PollerService } from './services/poller.js';
import { MqttSubscriber } from './services/mqttSubscriber.js';
import { DaliClient } from './controllers/daliClient.js';
import deviceRoutes from './routes/devices.js';
import historyRoutes from './routes/history.js';
import wsRoutes from './routes/ws.js';

const start = async () => {
  try {
    const config = await loadConfig();
    const fastify = Fastify({
      logger: {
        transport: {
          target: 'pino-pretty',
        },
      },
    });

    const influxWriter = new InfluxWriter(config.influx);
    // const poller = new PollerService(config, influxWriter);
    // poller.start();

    const clients = config.controllers.map((c) => new DaliClient(c));
    const mqttSubscriber = new MqttSubscriber(config.mqtt, influxWriter, clients);
    mqttSubscriber.connect();

    await fastify.register(cors);
    await fastify.register(websocket);

    // Register routes
    await fastify.register(deviceRoutes);
    await fastify.register(historyRoutes);
    await fastify.register(wsRoutes);

    fastify.get('/api/health', async () => {
      return { status: 'ok' };
    });

    fastify.get('/api/config', async () => {
      return {
        controllers: config.controllers.length,
        influx: config.influx.url,
      };
    });

    await fastify.listen({ port: config.server.port, host: '0.0.0.0' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

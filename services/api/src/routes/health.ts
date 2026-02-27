import { FastifyInstance } from 'fastify';
import { MqttSubscriber } from '../services/mqttSubscriber.js';
import { InfluxWriter } from '../services/influxWriter.js';
import { DaliClient } from '../controllers/daliClient.js';

interface HealthCheckOptions {
  mqttSubscriber: MqttSubscriber;
  influxWriter: InfluxWriter;
  daliClients: DaliClient[];
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  message: string;
}

interface ControllerHealth extends ServiceHealth {
  name: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    mqtt: ServiceHealth;
    influxdb: ServiceHealth;
    controllers: ControllerHealth[];
  };
}

// Helper function to run health check with timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

export default async function healthRoutes(
  fastify: FastifyInstance,
  options: HealthCheckOptions
) {
  const { mqttSubscriber, influxWriter, daliClients } = options;

  fastify.get('/api/health', async (request, reply) => {
    const TIMEOUT_MS = 5000; // 5 seconds timeout per service
    const timestamp = new Date().toISOString();

    // Check MQTT health
    let mqttHealth: ServiceHealth;
    try {
      mqttHealth = await withTimeout(
        Promise.resolve(mqttSubscriber.checkHealth()),
        TIMEOUT_MS,
        'MQTT health check timeout'
      );
    } catch (error: any) {
      mqttHealth = {
        status: 'unhealthy',
        message: error.message || 'MQTT health check failed',
      };
    }

    // Check InfluxDB health
    let influxHealth: ServiceHealth;
    try {
      influxHealth = await withTimeout(
        influxWriter.checkHealth(),
        TIMEOUT_MS,
        'InfluxDB health check timeout'
      );
    } catch (error: any) {
      influxHealth = {
        status: 'unhealthy',
        message: error.message || 'InfluxDB health check failed',
      };
    }

    // Check all controllers health
    const controllerHealthChecks = daliClients.map(async (client) => {
      try {
        const health = await withTimeout(
          client.checkHealth(),
          TIMEOUT_MS,
          `Controller ${client.getConfig().name} health check timeout`
        );
        return {
          name: client.getConfig().name,
          ...health,
        };
      } catch (error: any) {
        return {
          name: client.getConfig().name,
          status: 'unhealthy' as const,
          message: error.message || 'Controller health check failed',
        };
      }
    });

    const controllersHealth = await Promise.all(controllerHealthChecks);

    // Determine overall status - unhealthy if ANY service fails
    const allHealthy =
      mqttHealth.status === 'healthy' &&
      influxHealth.status === 'healthy' &&
      controllersHealth.every((c) => c.status === 'healthy');

    const overallStatus = allHealthy ? 'healthy' : 'unhealthy';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp,
      services: {
        mqtt: mqttHealth,
        influxdb: influxHealth,
        controllers: controllersHealth,
      },
    };

    // Return 503 Service Unavailable if unhealthy, 200 OK if healthy
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    reply.code(statusCode).send(response);
  });
}

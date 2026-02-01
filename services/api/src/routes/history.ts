import { FastifyInstance } from 'fastify';
import { InfluxDB } from 'influx';
import { loadConfig } from '../config/loader.js';

export default async function historyRoutes(fastify: FastifyInstance) {
  const config = await loadConfig();
  const influx = new InfluxDB({
    host: 'influxdb',
    port: 8086,
    database: config.influx.bucket,
  });

  fastify.get('/api/devices/:guid/history', async (request: any, reply) => {
    const { guid } = request.params;
    const { property, range = '24h' } = request.query as any;

    if (!property) {
      return reply.code(400).send({ error: 'Property is required' });
    }

    // Sanitize query to prevent injection if using raw query
    // Influx library usually handles parameters
    const query = `
      SELECT value_num 
      FROM dali_property 
      WHERE device_guid = '${guid}' 
      AND property = '${property}' 
      AND time > now() - ${range}
    `;

    try {
      const results = await influx.query(query);
      return results;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Database error' });
    }
  });
}

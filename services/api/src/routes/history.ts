import { FastifyInstance } from 'fastify';
import { InfluxDB } from '@influxdata/influxdb-client';
import { loadConfig } from '../config/loader.js';

export default async function historyRoutes(fastify: FastifyInstance) {
  const config = await loadConfig();
  const queryApi = new InfluxDB({
    url: config.influx.url,
    token: config.influx.token,
  }).getQueryApi(config.influx.org);

  fastify.get('/api/devices/:guid/history', async (request: any, reply) => {
    const { guid } = request.params;
    const { property, range = '24h' } = request.query as any;

    if (!property) {
      return reply.code(400).send({ error: 'Property is required' });
    }

    const safeGuid = validateTag(guid, 'guid');
    const safeProperty = validateTag(property, 'property');
    const safeRange = validateRange(range);

    const fluxQuery = `
      from(bucket: "${config.influx.bucket}")
        |> range(start: -${safeRange})
        |> filter(fn: (r) => r._measurement == "dali_property")
        |> filter(fn: (r) => r.device_guid == "${safeGuid}" and r.property == "${safeProperty}")
        |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
        |> keep(columns: ["_time", "value_num", "value_str", "controller", "unit", "device_guid", "property"])
        |> sort(columns: ["_time"])
    `;

    try {
      const rows = await queryApi.collectRows(fluxQuery);
      return rows;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Database error' });
    }
  });
}

function validateTag(value: string, label: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9:_\-]+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function validateRange(range: string): string {
  if (typeof range === 'string' && /^[0-9]+(s|m|h|d|w)$/i.test(range)) {
    return range;
  }
  return '24h';
}

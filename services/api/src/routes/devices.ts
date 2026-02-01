import { FastifyInstance } from 'fastify';

// This would ideally be an interface merging into FastifyInstance
// but for now we just assume we can get data somehow.
// In a real app, we might use fastify-plugin to decorate fastify with a store.

export default async function deviceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/devices', async (request, reply) => {
    // TODO: Get actual devices from PollerService cache or Influx
    // For now returning mock data to satisfy contract
    return [
      {
        guid: 'mock-device-1',
        title: 'Mock Device 1',
        zone: 'Zone 1',
        properties: {
          lightLevel: 80,
          driverInputPower: 12
        }
      }
    ];
  });

  fastify.get('/api/devices/:guid', async (request: any, reply) => {
    const { guid } = request.params;
    return {
      guid,
      title: `Device ${guid}`,
      // ...
    };
  });
}

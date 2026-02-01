import { FastifyInstance } from 'fastify';

export default async function wsRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/devices', { websocket: true }, (connection, req) => {
    connection.socket.on('message', message => {
      // Handle incoming messages if needed (e.g. subscribe to specific devices)
    });

    // In a real implementation, we would register this connection 
    // to a centralized EventBus or PubSub to receive updates from PollerService.
    // For now, we'll just send a heartbeat or mock data.
    
    const interval = setInterval(() => {
      if (connection.socket.readyState === connection.socket.OPEN) {
        connection.socket.send(JSON.stringify({
          type: 'update',
          data: {
            guid: 'mock-device-1',
            property: 'lightLevel',
            value: Math.random() * 100,
            timestamp: new Date()
          }
        }));
      } else {
        clearInterval(interval);
      }
    }, 5000);
  });
}

import { InfluxDB } from 'influx';
import { loadConfig } from '../src/config/loader.js';

async function seed() {
  const config = await loadConfig();
  const influx = new InfluxDB({
    host: 'localhost',
    port: 8086,
    database: config.influx.bucket,
  });

  const points = [];
  const now = Date.now();

  for (let i = 0; i < 100; i++) {
    points.push({
      measurement: 'dali_property',
      tags: {
        device_guid: 'mock-device-1',
        property: 'driverInputPower',
      },
      fields: {
        value_num: Math.random() * 50,
      },
      timestamp: new Date(now - i * 60000), // Last 100 mins
    });
  }

  await influx.writePoints(points);
  console.log('Seeded 100 points');
}

seed().catch(console.error);

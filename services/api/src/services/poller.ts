import { DaliClient } from '../controllers/daliClient.js';
import { InfluxWriter } from './influxWriter.js';
import { AppConfig } from '../types/config.js';

export class PollerService {
  private clients: DaliClient[] = [];
  private influxWriter: InfluxWriter;
  private intervalSec: number;

  constructor(config: AppConfig, influxWriter: InfluxWriter) {
    this.influxWriter = influxWriter;
    this.intervalSec = config.controllers[0]?.pollingIntervalSec || 10;

    this.clients = config.controllers.map(c => new DaliClient(c));
  }

  start() {
    console.log(`Starting poller service with ${this.clients.length} controllers, interval ${this.intervalSec}s`);
    this.poll(); // Initial poll
    setInterval(() => this.poll(), this.intervalSec * 1000);
  }

  private async poll() {
    await Promise.all(this.clients.map(client => this.pollController(client)));
  }

  private async pollController(client: DaliClient) {
    try {
      const devices = await client.getDevices();
      console.log(`Found ${devices.length} devices for controller`);

      for (const device of devices) {
        // Fetch properties
        // For minimal scope, let's pick a few important ones or iterate all if specified
        // Assuming we fetch 'lightLevel' and 'driverInputPower' as examples
        const propsToFetch = ['lightLevel', 'driverInputPower', 'errorOverall'];
        
        for (const prop of propsToFetch) {
            try {
                const data = await client.getProperty(device.guid, prop);
                if (data && data.value !== undefined) {
                    await this.influxWriter.writePoint({
                        measurement: 'dali_property',
                        tags: {
                            device_guid: device.guid,
                            property: prop,
                            unit: data.unit || '',
                        },
                        fields: {
                            value_num: typeof data.value === 'number' ? data.value : 0,
                            value_str: typeof data.value === 'string' ? data.value : '',
                        }
                    });
                }
            } catch (e) {
                // Ignore specific property fetch error
            }
        }
      }
    } catch (error) {
      console.error('Error polling controller:', error);
    }
  }
}

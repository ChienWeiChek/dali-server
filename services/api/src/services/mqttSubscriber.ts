import mqtt, { MqttClient } from 'mqtt';
import { MqttConfig } from '../types/config.js';
import { InfluxWriter } from './influxWriter.js';
import { DaliClient } from '../controllers/daliClient.js';

export class MqttSubscriber {
  private client: MqttClient | null = null;
  private config: MqttConfig;
  private influxWriter: InfluxWriter;
  private clients: DaliClient[] = [];
  private deviceTitleMap: Map<string, string> = new Map();

  constructor(config: MqttConfig, influxWriter: InfluxWriter, clients: DaliClient[] = []) {
    this.config = config;
    this.influxWriter = influxWriter;
    this.clients = clients;

    // Start initial sync
    if (this.clients.length > 0) {
      this.syncDevices();
      // Periodic sync every hour
      setInterval(() => this.syncDevices(), 3600000);
    }
  }

  private async syncDevices() {
    console.log('Syncing device titles from controllers...');
    let totalSynced = 0;
    for (const client of this.clients) {
      try {
        console.log(`Fetching devices from ${client.getConfig().name}...`);
        const devices = await client.getDevices();
        for (const device of devices) {
          if (device.guid && device.title) {
            this.deviceTitleMap.set(device.guid, device.title);
            totalSynced++;
          }
        }
      } catch (e) {
        console.error(`Failed to sync devices from controller ${client.getConfig().name}:`, e);
      }
    }
    console.log(`Device sync complete. Total titles cached: ${this.deviceTitleMap.size} (New/Updated: ${totalSynced})`);
  }

  connect() {
    console.log(`Connecting to MQTT broker at ${this.config.brokerUrl}`);
    this.client = mqtt.connect(this.config.brokerUrl, {
      username: this.config.username,
      password: this.config.password,
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      this.subscribe();
    });

    this.client.on('reconnect', () => {
      console.log('MQTT Reconnecting...');
    });

    this.client.on('error', (err) => {
      console.error('MQTT Error:', err);
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  subscribe() {
    if (!this.client) return;
    const topic = this.config.topic;
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  }

  checkHealth(): { status: 'healthy' | 'unhealthy'; message: string } {
    if (!this.client) {
      return { status: 'unhealthy', message: 'MQTT client not initialized' };
    }
    
    if (this.client.connected) {
      return { status: 'healthy', message: 'Connected to MQTT broker' };
    }
    
    return { status: 'unhealthy', message: 'MQTT client disconnected' };
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      // Topic structure: DALI-PRO-IoT/<deviceName>/devices/<category>/<guid>/data/<property>
      // Example: DALI-PRO-IoT/Controller1/devices/sensors/abc-123/data/temperature
      
      console.log(`${topic} -> ${message}`)
      const parts = topic.split('/');
      // Expecting 7 parts
      // 0: DALI-PRO-IoT
      // 1: deviceName (Controller)
      // 2: devices
      // 3: category
      // 4: guid
      // 5: data
      // 6: property

      if (parts.length < 7 || parts[0] !== 'DALI-PRO-IoT' || parts[2] !== 'devices' || parts[5] !== 'data') {
        console.warn(`Ignoring malformed topic: ${topic}`);
        return;
      }

      const deviceName = parts[1];
      const category = parts[3];
      const guid = parts[4];
      const property = parts[6];

      // Payload: {"date": "...", "time": "...", "value": ..., "unit": "..."}
      const payloadStr = message.toString();
      let payload: any;
      try {
        payload = JSON.parse(payloadStr);
      } catch (e) {
        console.warn(`Failed to parse JSON payload for ${topic}: ${payloadStr}`);
        return;
      }

      const value = payload.value;
      const unit = payload.unit || 'none';

      const fields: { [key: string]: any } = {};
      if (typeof value === 'number') {
        fields.value_num = value;
      } else {
        fields.value_str = String(value);
      }

      // Using server receive time (now), ignoring payload date/time as requested
      const timestamp = new Date();

      // Lookup title
      const title = this.deviceTitleMap.get(guid) || 'Unknown';

      await this.influxWriter.writePoint({
        measurement: 'dali_property',
        tags: {
          controller: deviceName,
          category: category,
          device_guid: guid,
          property: property,
          unit: unit,
          title: title,
        },
        fields: fields,
        timestamp: timestamp,
      });

    } catch (err) {
      console.error(`Error handling MQTT message for ${topic}:`, err);
    }
  }
}

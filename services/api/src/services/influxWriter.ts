import { InfluxDB, IPoint } from 'influx';
import { AppConfig } from '../types/config.js';

export class InfluxWriter {
  private influx: InfluxDB;
  private batch: IPoint[] = [];
  private batchSize = 1000;
  private flushInterval = 5000; // 5s
  private timer: NodeJS.Timeout | null = null;

  constructor(config: AppConfig['influx']) {
    const url = new URL(config.url);
    this.influx = new InfluxDB({
      host: url.hostname, // docker service name
      port: parseInt(url.port) || 8086,
      database: config.bucket, // Using database for Influx 1.8 compatibility
      username: config.username || 'admin',
      password: config.password || 'admin',
      // For 1.8 we might not use token in the same way as 2.x, but let's stick to standard config
    });

    // Start flush timer
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  async writePoint(point: IPoint) {
    this.batch.push(point);
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.batch.length === 0) return;

    const pointsToWrite = [...this.batch];
    this.batch = [];

    try {
      await this.influx.writePoints(pointsToWrite);
      console.log(`Flushed ${pointsToWrite.length} points to InfluxDB`);
    } catch (error) {
      console.error('Error writing to InfluxDB:', error);
      // Simple retry strategy: put them back? Or drop to avoid memory leak?
      // For now, drop but log.
    }
  }
}

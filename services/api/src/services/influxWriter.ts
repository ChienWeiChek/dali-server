import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import { AppConfig } from '../types/config.js';

export interface InfluxPoint {
  measurement: string;
  tags?: Record<string, string>;
  fields: Record<string, string | number | boolean>;
  timestamp?: Date | number;
}

export class InfluxWriter {
  private writeApi: WriteApi;
  private batch: InfluxPoint[] = [];
  private batchSize = 1000;
  private flushInterval = 5000; // 5s
  private timer: NodeJS.Timeout | null = null;

  constructor(config: AppConfig['influx']) {
    const url = new URL(config.url);
    const client = new InfluxDB({
      url: url.origin,
      token: config.token,
    });

    this.writeApi = client.getWriteApi(config.org, config.bucket, 'ns', {
      batchSize: this.batchSize,
      flushInterval: this.flushInterval,
    });

    // Manual batching so we can reuse existing call sites before switching fully
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  async writePoint(point: InfluxPoint) {
    this.batch.push(point);
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.batch.length === 0) {
      return;
    }

    const pointsToWrite = [...this.batch];
    this.batch = [];

    try {
      pointsToWrite.forEach((p) => {
        const point = new Point(p.measurement);

        if (p.tags) {
          Object.entries(p.tags).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              point.tag(key, value);
            }
          });
        }

        Object.entries(p.fields).forEach(([key, value]) => {
          if (typeof value === 'number') {
            point.floatField(key, value);
          } else if (typeof value === 'boolean') {
            point.booleanField(key, value);
          } else if (typeof value === 'string') {
            point.stringField(key, value);
          }
        });

        if (p.timestamp instanceof Date) {
          point.timestamp(p.timestamp);
        } else if (typeof p.timestamp === 'number') {
          point.timestamp(p.timestamp);
        }

        this.writeApi.writePoint(point);
      });

      await this.writeApi.flush();
      console.log(`Flushed ${pointsToWrite.length} points to InfluxDB 2.x`);
    } catch (error) {
      console.error('Error writing to InfluxDB 2.x:', error);
    }
  }

  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Attempt to flush to verify connection
      await this.writeApi.flush();
      return { status: 'healthy', message: 'InfluxDB connection successful' };
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `InfluxDB connection failed: ${error.message || 'Unknown error'}` 
      };
    }
  }

  dispose() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.writeApi.flush();
  }
}

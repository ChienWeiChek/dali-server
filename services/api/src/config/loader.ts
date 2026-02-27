import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { AppConfig, ControllerConfig, AuthConfig } from '../types/config.js';

// Load env vars from root .env if in dev
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const DEFAULT_CONTROLLER_PATH = path.resolve(process.cwd(), '../../config/controllers.json');
const DEFAULT_AUTH_PATH = path.resolve(process.cwd(), '../../config/auth.json');

async function getValidPath(envPath: string | undefined, defaultPath: string): Promise<string> {
  if (envPath) {
    try {
      await fs.access(envPath);
      return envPath;
    } catch {
      // Env path not found (likely local run with Docker env vars), fallback
    }
  }
  return defaultPath;
}

export async function loadConfig(): Promise<AppConfig> {
  const controllerPath = await getValidPath(process.env.CONTROLLER_CONFIG_PATH, DEFAULT_CONTROLLER_PATH);
  const authPath = await getValidPath(process.env.AUTH_CONFIG_PATH, DEFAULT_AUTH_PATH);

  const controllersRaw = await fs.readFile(controllerPath, 'utf-8');
  const controllers: ControllerConfig[] = JSON.parse(controllersRaw);

  const authRaw = await fs.readFile(authPath, 'utf-8');
  const auth: AuthConfig = JSON.parse(authRaw);

  return {
    controllers,
    auth,
    influx: {
      url: process.env.INFLUX2_URL || process.env.INFLUX_URL || 'http://localhost:8086',
      token: process.env.INFLUX_TOKEN || 'my-token',
      org: process.env.INFLUX_ORG || 'dali',
      bucket: process.env.INFLUX_BUCKET || 'dali_devices',
      username: process.env.INFLUX_ADMIN_USER || 'admin',
      password: process.env.INFLUX_ADMIN_PASSWORD || 'admin123',
    },
    mqtt: {
      brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883',
      username: process.env.MQTT_USERNAME || 'admin',
      password: process.env.MQTT_PASSWORD || 'admin123',
      topic: process.env.MQTT_TOPIC || 'DALI-PRO-IoT/+/devices/+/+/data/#',
    },
    server: {
      port: parseInt(process.env.API_PORT || '3000', 10),
    },
  };
}

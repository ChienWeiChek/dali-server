import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { AppConfig, ControllerConfig, AuthConfig } from '../types/config.js';

// Load env vars from root .env if in dev
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const CONTROLLER_CONFIG_PATH = process.env.CONTROLLER_CONFIG_PATH || path.resolve(process.cwd(), '../../config/controllers.json');
const AUTH_CONFIG_PATH = process.env.AUTH_CONFIG_PATH || path.resolve(process.cwd(), '../../config/auth.json');

export async function loadConfig(): Promise<AppConfig> {
  const controllersRaw = await fs.readFile(CONTROLLER_CONFIG_PATH, 'utf-8');
  const controllers: ControllerConfig[] = JSON.parse(controllersRaw);

  const authRaw = await fs.readFile(AUTH_CONFIG_PATH, 'utf-8');
  const auth: AuthConfig = JSON.parse(authRaw);

  return {
    controllers,
    auth,
    influx: {
      url: process.env.INFLUX_URL || 'http://localhost:8086',
      token: process.env.INFLUX_TOKEN || 'my-token',
      org: process.env.INFLUX_ORG || 'dali',
      bucket: process.env.INFLUX_BUCKET || 'dali_devices',
    },
    server: {
      port: parseInt(process.env.API_PORT || '3000', 10),
    },
  };
}

export interface ControllerConfig {
  name: string;
  ip: string;
  username: string;
  password?: string; // Optional because we might load it from elsewhere or secrets
  pollingIntervalSec: number;
}

export interface AuthConfig {
  username: string;
  passwordHash: string;
}

export interface AppConfig {
  controllers: ControllerConfig[];
  auth: AuthConfig;
  influx: {
    url: string;
    token: string;
    org: string;
    bucket: string;
  };
  server: {
    port: number;
  };
}

export interface DaliDevice {
  guid: string;
  type: string;
  title: string;
  shortAddress: number;
  zones?: string[];
  properties?: string[];
  // Add other fields from api.md
}

export interface DaliProperty {
  guid: string;
  property: string;
  value: number | string;
  unit?: string;
  timestamp: Date;
}

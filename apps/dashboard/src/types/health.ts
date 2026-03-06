export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  message: string;
}

export interface ControllerHealth extends ServiceHealth {
  name: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    mqtt: ServiceHealth;
    influxdb: ServiceHealth;
    controllers: ControllerHealth[];
  };
}

export type OverallHealthStatus = 'healthy' | 'degraded' | 'critical';

export interface HealthIndicatorState {
  status: OverallHealthStatus;
  data: HealthCheckResponse | null;
  loading: boolean;
  error: string | null;
  lastChecked: string | null;
}

export interface Device {
  guid: string;
  title: string;
  type: string;
  class?: string;
  shortAddress: number;
  port?: number;
  zone?: string;
  zones?: string[];
  properties?: string[];
  gtin?: string;
  serial?: string;
  error?: boolean;
  errorBits?: number;
  errors?: string[];
}

export interface DashboardMetrics {
  totalDevices: number;
  avgLightLevel: number;
  totalEnergy: number;
  activeErrors: number;
  avgPower?: number;
  deviceCount?: number;
  errorCount?: number;
}

export interface ChartData {
  lightLevelTrend: { time: string; value: number }[];
  energyByDevice: { name: string; value: number }[];
  devicesByZone: { name: string; value: number }[];
  powerTrend: { time: string; value: number }[];
}

export interface RealTimeMetrics {
  power: number;
  temperature: number;
  voltage: number;
}

export interface PropertyValue {
  guid: string;
  property: string;
  value: number;
  unit?: string;
  date: string;
  time: string;
}

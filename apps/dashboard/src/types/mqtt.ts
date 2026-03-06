export interface ControllerInfo {
  title: string;
  gtin: string;
  serial: string;
  deviceVersion: string;
  daliSerial: string;
  daliFwVersion: string;
  macAddress: string;
  wifissid: string;
  wifikey: string;
  timeUtc: string;
  controlNoEncryption: boolean;
  appNoEncryption: boolean;
}

export interface MqttStatus {
  brokerAddress: string;
  port: number;
  profile: number;
  username: string;
  passwordExist: boolean;
  encrypted: boolean;
  validateServerCert: boolean;
  connected: boolean;
  clientId: string;
  title: string;
}

export interface MqttSettings {
  brokerAddress: string;
  port: string | number;
  username: string;
  password?: string;
}

export interface ProfileItem {
  property: string;
  interval: number;
}

export interface ProfileData {
  profileItems: ProfileItem[];
}

export interface ProfileListResponse {
  profiles: string[];
  activeProfiles: string[];
}

// Property display names
export const PROPERTY_LABELS: Record<string, string> = {
  driverInputVoltage: "Driver Input Voltage",
  driverEnergyConsumption: "Driver Energy Consumption",
  driverInputPower: "Driver Input Power",
  driverOperationTime: "Driver Operation Time",
  driverTemperature: "Driver Temperature",
  errorOverall: "Error Overall",
  lampOperationTime: "Lamp Operation Time",
  lightLevel: "Light Level",
  errorBits: "Error Bits",
  errorBitsCoupler: "Error Bits Coupler",
};

export const AVAILABLE_PROPERTIES = Object.keys(PROPERTY_LABELS);

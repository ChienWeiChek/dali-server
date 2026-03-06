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
  profilItems: ProfileItem[];
}

export interface ProfileList {
  profiles: string[];
}

// Available property options
export const AVAILABLE_PROPERTIES = [
  "driverInputVoltage",
  "driverEnergyConsumption",
  "driverInputPower",
  "driverOperationTime",
  "driverTemperature",
  "errorOverall",
  "lampOperationTime",
  "lightLevel",
  "errorBits",
  "errorBitsCoupler",
] as const;

export type PropertyType = (typeof AVAILABLE_PROPERTIES)[number];

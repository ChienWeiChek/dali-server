import axios, { AxiosInstance } from "axios";
import { ControllerConfig } from "../types/config.js";
import {
  ControllerInfo,
  MqttStatus,
  MqttSettings,
  ProfileList,
  ProfileData,
} from "../types/mqtt.js";

export class DaliClient {
  private axiosInstance: AxiosInstance;
  private authHeader: string | null = null;
  private config: ControllerConfig;

  constructor(config: ControllerConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: `http://${config.ip}`,
      timeout: 5000,
    });
  }

  async login(): Promise<void> {
    try {
      const response = await this.axiosInstance.post("/auth/login", {
        username: this.config.username,
        password: this.config.password,
      });

      if (response.status === 200 && response.data?.authHeader) {
        this.authHeader = response.data.authHeader;
        console.log(`[${this.config.name}] Login successful`);
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error) {
      console.error(`[${this.config.name}] Login failed`);
      throw error;
    }
  }

  private async request<T>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any,
    retry = true,
  ): Promise<T> {
    if (!this.authHeader) {
      await this.login();
    }

    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url,
        data,
        headers: {
          Authorization: this.authHeader,
        },
      });
      return response.data;
    } catch (error: any) {
      if (
        retry &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        console.warn(`[${this.config.name}] Token expired, re-logging in...`);
        this.authHeader = null;
        await this.login();
        return this.request<T>(method, url, data, false);
      }
      throw error;
    }
  }

  async getDevices(): Promise<any[]> {
    const response = await this.request<{ deviceList: any[] }>(
      "get",
      "/api/bmsapi/dali-devices",
    );
    return response.deviceList || [];
  }

  async getDeviceDetails(guid: string): Promise<any> {
    return this.request<any>("get", `/api/bmsapi/dali-devices/${guid}`);
  }

  async getProperty(guid: string, property: string): Promise<any> {
    // Try active first, maybe fallback to last?
    // Api.md says /active
    return this.request<any>(
      "get",
      `/api/bmsapi/dali-devices/${guid}/property/${property}/last`,
    );
  }

  async getGroups(): Promise<any[]> {
    const response = await this.request<{ lightGroupList: any[] }>(
      "get",
      "/api/bmsapi/groups",
    );
    return response.lightGroupList || [];
  }

  async getGroupsDetail(groupId: string): Promise<{}> {
    const response = await this.request<{ lightGroupList: any[] }>(
      "get",
      `/api/bmsapi/groups/${groupId}`,
    );
    return response || {};
  }

  async recallScene(
    groupId: string,
    sceneNr: number,
    payload: Record<string, any>,
  ): Promise<{}> {
    const response = await this.request<{ lightGroupList: any[] }>(
      "put",
      `/api/bmsapi/groups/${groupId}/state`,
      { sceneNr, ...payload },
    );
    return response || {};
  }

  async getGroupState(groupId: string): Promise<{}> {
    const response = await this.request(
      "get",
      `/api/bmsapi/groups/${groupId}/state`,
    );
    return response || {};
  }

  async getError(): Promise<{}> {
    const response = await this.request<{ deviceList: any[] }>(
      "get",
      `/api/bmsapi/dali-devices/error`,
    );
    return response.deviceList || {};
  }

  async checkHealth(): Promise<{
    status: "healthy" | "unhealthy";
    message: string;
  }> {
    try {
      // Try to get devices list as a simple connectivity check
      await this.getDevices();
      return {
        status: "healthy",
        message: `Connected to controller ${this.config.name}`,
      };
    } catch (error: any) {
      return {
        status: "unhealthy",
        message: `Controller ${this.config.name} unreachable: ${error.message || "Unknown error"}`,
      };
    }
  }

  // MQTT-related methods

  async getControllerInfo(): Promise<ControllerInfo> {
    return this.request<ControllerInfo>(
      "get",
      "/api/bmsapi/application-controller/info",
    );
  }

  async getMqttStatus(): Promise<MqttStatus> {
    return this.request<MqttStatus>("get", "/api/bmsapi/mqtt-interface");
  }

  async updateMqttSettings(settings: MqttSettings): Promise<void> {
    return this.request<void>("put", "/api/bmsapi/mqtt-interface", settings);
  }

  async getProfiles(): Promise<ProfileList> {
    return this.request<ProfileList>(
      "get",
      "/api/bmsapi/property-scheduler-profiles/data",
    );
  }

  async getProfileDetail(profileName: string): Promise<ProfileData> {
    return this.request<ProfileData>(
      "get",
      `/api/bmsapi/property-scheduler-profiles/data/${encodeURIComponent(profileName)}`,
    );
  }

  async updateProfile(profileName: string, data: ProfileData): Promise<void> {
    return this.request<void>(
      "put",
      `/api/bmsapi/property-scheduler-profiles/data/${encodeURIComponent(profileName)}`,
      data,
    );
  }

  async getActiveProfiles(): Promise<ProfileList> {
    return this.request<ProfileList>(
      "get",
      "/api/bmsapi/property-scheduler-profiles/active",
    );
  }

  async activateProfile(profileName: string): Promise<void> {
    return this.request<void>(
      "put",
      `/api/bmsapi/property-scheduler-profiles/active/${encodeURIComponent(profileName)}`,
    );
  }

  async deactivateProfile(profileName: string): Promise<void> {
    return this.request<void>(
      "delete",
      `/api/bmsapi/property-scheduler-profiles/active/${encodeURIComponent(profileName)}`,
    );
  }

  async deleteProfile(profileName: string): Promise<void> {
    return this.request<void>(
      "delete",
      `/api/bmsapi/property-scheduler-profiles/data/${encodeURIComponent(profileName)}`,
    );
  }

  getConfig(): ControllerConfig {
    return this.config;
  }
}

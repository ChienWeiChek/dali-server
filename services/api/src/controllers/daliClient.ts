import axios, { AxiosInstance } from 'axios';
import { ControllerConfig } from '../types/config.js';

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
      const response = await this.axiosInstance.post('/auth/login', {
        username: this.config.username,
        password: this.config.password,
      });

      if (response.status === 200 && response.data?.authHeader) {
        this.authHeader = response.data.authHeader;
        console.log(`[${this.config.name}] Login successful`);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error(`[${this.config.name}] Login failed:`, error);
      throw error;
    }
  }

  private async request<T>(method: 'get' | 'post', url: string, data?: any, retry = true): Promise<T> {
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
      if (retry && (error.response?.status === 401 || error.response?.status === 403)) {
        console.warn(`[${this.config.name}] Token expired, re-logging in...`);
        this.authHeader = null;
        await this.login();
        return this.request<T>(method, url, data, false);
      }
      throw error;
    }
  }

  async getDevices(): Promise<any[]> {
    const response = await this.request<{ deviceList: any[] }>('get', '/api/bmsapi/dali-devices');
    return response.deviceList || [];
  }

  async getDeviceDetails(guid: string): Promise<any> {
    return this.request<any>('get', `/api/bmsapi/dali-devices/${guid}`);
  }

  async getProperty(guid: string, property: string): Promise<any> {
    // Try active first, maybe fallback to last?
    // Api.md says /active
    return this.request<any>('get', `/api/bmsapi/dali-devices/${guid}/property/${property}/active`);
  }
}

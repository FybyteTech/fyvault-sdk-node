import type { HttpClient } from "../http.js";
import type { Device, RegisterDeviceInput } from "../types.js";

export class DevicesResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async list(): Promise<Device[]> {
    return this.http.get(`/orgs/${this.orgId}/devices`);
  }

  async get(deviceId: string): Promise<Device> {
    return this.http.get(`/orgs/${this.orgId}/devices/${deviceId}`);
  }

  async register(input: RegisterDeviceInput): Promise<Device> {
    return this.http.post(`/orgs/${this.orgId}/devices`, input);
  }

  async revoke(deviceId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/devices/${deviceId}`);
  }

  async update(deviceId: string, data: { name?: string }): Promise<Device> {
    return this.http.patch(`/orgs/${this.orgId}/devices/${deviceId}`, data);
  }

  async assignSecret(deviceId: string, secretId: string): Promise<void> {
    await this.http.post(`/orgs/${this.orgId}/devices/${deviceId}/secrets`, { secretId });
  }

  async unassignSecret(deviceId: string, secretId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/devices/${deviceId}/secrets/${secretId}`);
  }
}

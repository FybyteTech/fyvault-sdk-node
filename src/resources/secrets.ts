import type { HttpClient } from "../http.js";
import type { Secret, SecretValue, SecretVersion, CreateSecretInput } from "../types.js";

export class SecretsResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async list(): Promise<Secret[]> {
    return this.http.get(`/orgs/${this.orgId}/secrets`);
  }

  async get(secretId: string): Promise<Secret> {
    return this.http.get(`/orgs/${this.orgId}/secrets/${secretId}`);
  }

  async getByName(name: string): Promise<Secret> {
    return this.http.get(`/orgs/${this.orgId}/secrets/by-name/${encodeURIComponent(name)}`);
  }

  async getValue(secretId: string): Promise<string> {
    const result = await this.http.get<SecretValue>(`/orgs/${this.orgId}/secrets/${secretId}/value`);
    return result.value;
  }

  async getValueByName(name: string): Promise<string> {
    const result = await this.http.get<SecretValue>(
      `/orgs/${this.orgId}/secrets/by-name/${encodeURIComponent(name)}/value`
    );
    return result.value;
  }

  async create(input: CreateSecretInput): Promise<Secret> {
    return this.http.post(`/orgs/${this.orgId}/secrets`, input);
  }

  async update(secretId: string, value: string): Promise<Secret> {
    return this.http.patch(`/orgs/${this.orgId}/secrets/${secretId}`, { value });
  }

  async delete(secretId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/secrets/${secretId}`);
  }

  async versions(secretId: string): Promise<SecretVersion[]> {
    return this.http.get(`/orgs/${this.orgId}/secrets/${secretId}/versions`);
  }
}

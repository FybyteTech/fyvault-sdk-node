import type { HttpClient } from "../http.js";
import type { Environment, CreateEnvironmentInput } from "../types.js";

export class EnvironmentsResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async list(): Promise<Environment[]> {
    return this.http.get(`/orgs/${this.orgId}/environments`);
  }

  async get(envId: string): Promise<Environment> {
    return this.http.get(`/orgs/${this.orgId}/environments/${envId}`);
  }

  async create(input: CreateEnvironmentInput): Promise<Environment> {
    return this.http.post(`/orgs/${this.orgId}/environments`, input);
  }

  async update(envId: string, input: Partial<CreateEnvironmentInput>): Promise<Environment> {
    return this.http.patch(`/orgs/${this.orgId}/environments/${envId}`, input);
  }

  async delete(envId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/environments/${envId}`);
  }

  async setDefault(envId: string): Promise<void> {
    await this.http.post(`/orgs/${this.orgId}/environments/${envId}/set-default`);
  }
}

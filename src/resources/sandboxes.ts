import type { HttpClient } from "../http.js";

export interface Sandbox {
  environmentId: string;
  name: string;
  autoDestroyAt: string;
}

export interface CreateSandboxInput {
  parentEnvId: string;
  secretNames: string[];
  ttlMinutes?: number;
}

export class SandboxesResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async create(input: CreateSandboxInput): Promise<Sandbox> {
    return this.http.post(`/orgs/${this.orgId}/environments/sandbox`, {
      parentEnvId: input.parentEnvId,
      secretNames: input.secretNames,
      ttlMinutes: input.ttlMinutes ?? 30,
    });
  }

  async list(): Promise<Sandbox[]> {
    return this.http.get(`/orgs/${this.orgId}/environments/sandbox`);
  }

  async destroy(envId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/environments/sandbox/${envId}`);
  }
}

import type { HttpClient } from "../http.js";
import type { ProviderIntegration } from "../types.js";

export interface RegisterProviderInput {
  name: string;
  description?: string;
  providerType?: string;
  allowedEnvironments?: string[];
  allowedSecretPrefix?: string;
  rateLimitRpm?: number;
  ipAllowlist?: string[];
}

export interface UpdateProviderInput {
  description?: string;
  allowedEnvironments?: string[];
  allowedSecretPrefix?: string;
  rateLimitRpm?: number;
  ipAllowlist?: string[];
}

export interface RegisterProviderResult {
  provider: ProviderIntegration;
  token: string;
  webhookSecret: string;
}

export class ProvidersResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async register(input: RegisterProviderInput): Promise<RegisterProviderResult> {
    return this.http.post(`/orgs/${this.orgId}/providers`, input);
  }

  async list(): Promise<ProviderIntegration[]> {
    return this.http.get(`/orgs/${this.orgId}/providers`);
  }

  async get(providerId: string): Promise<ProviderIntegration> {
    return this.http.get(
      `/orgs/${this.orgId}/providers/${encodeURIComponent(providerId)}`
    );
  }

  async update(providerId: string, input: UpdateProviderInput): Promise<ProviderIntegration> {
    return this.http.patch(
      `/orgs/${this.orgId}/providers/${encodeURIComponent(providerId)}`,
      input
    );
  }

  async revoke(providerId: string): Promise<void> {
    await this.http.delete(
      `/orgs/${this.orgId}/providers/${encodeURIComponent(providerId)}`
    );
  }
}

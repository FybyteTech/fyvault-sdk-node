import type { HttpClient } from "../http.js";
import type { AgentCredential } from "../types.js";

export interface CreateAgentCredentialInput {
  name: string;
  agentType?: string;
  scopes?: string[];
  allowedSecrets?: string[];
  allowedEnvironments?: string[];
  maxTtlSeconds?: number;
  rateLimitRpm?: number;
  ipAllowlist?: string[];
  expiresAt?: string;
}

export interface CreateAgentCredentialResult {
  credential: string;
  credential_id: string;
  name: string;
}

export class AgentCredentialsResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async create(input: CreateAgentCredentialInput): Promise<CreateAgentCredentialResult> {
    return this.http.post(`/orgs/${this.orgId}/agent-credentials`, input);
  }

  async list(): Promise<AgentCredential[]> {
    return this.http.get(`/orgs/${this.orgId}/agent-credentials`);
  }

  async revoke(credentialId: string): Promise<void> {
    await this.http.delete(
      `/orgs/${this.orgId}/agent-credentials/${encodeURIComponent(credentialId)}`
    );
  }
}

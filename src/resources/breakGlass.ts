import type { HttpClient } from "../http.js";

export interface BreakGlassSession {
  token: string;
  sessionId: string;
  autoRevokeAt: string;
}

export interface CreateBreakGlassInput {
  reason: string;
  environment?: string;
  ttlMinutes?: number;
}

export class BreakGlassResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async create(input: CreateBreakGlassInput): Promise<BreakGlassSession> {
    return this.http.post(`/orgs/${this.orgId}/break-glass`, {
      reason: input.reason,
      environmentId: input.environment,
      ttlMinutes: input.ttlMinutes ?? 60,
    });
  }
}

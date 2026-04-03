import type { HttpClient } from "../http.js";
import type { ApiScope, MintSessionTokenResult } from "../types.js";

export class AccessTokensResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  /**
   * Mint a short-lived session token using a long-lived API key (fv_live_...).
   * Use the returned token as Authorization: Bearer &lt;token&gt; instead of the API key at runtime.
   */
  async create(input?: {
    ttlSeconds?: number;
    scopes?: ApiScope[];
  }): Promise<MintSessionTokenResult> {
    return this.http.post(`/orgs/${this.orgId}/access-tokens`, input ?? {});
  }

  async revoke(sessionTokenId: string): Promise<void> {
    await this.http.delete(`/orgs/${this.orgId}/access-tokens/${encodeURIComponent(sessionTokenId)}`);
  }
}

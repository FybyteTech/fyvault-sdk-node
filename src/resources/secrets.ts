import type { HttpClient } from "../http.js";
import type { Secret, SecretValue, SecretVersion, CreateSecretInput, SecretHandle } from "../types.js";

export class SecretsResource {
  constructor(
    private http: HttpClient,
    private orgId: string,
    private environment?: string
  ) {}

  /** Append ?environment= when environment is configured */
  private envQ(extra?: string): string {
    const p: string[] = [];
    if (this.environment) p.push(`environment=${encodeURIComponent(this.environment)}`);
    if (extra) p.push(extra);
    return p.length ? `?${p.join("&")}` : "";
  }

  async list(): Promise<Secret[]> {
    return this.http.get(`/orgs/${this.orgId}/secrets${this.envQ()}`);
  }

  async get(secretId: string): Promise<Secret> {
    return this.http.get(`/orgs/${this.orgId}/secrets/${secretId}`);
  }

  async getByName(name: string): Promise<Secret> {
    return this.http.get(`/orgs/${this.orgId}/secrets/by-name/${encodeURIComponent(name)}`);
  }

  async getValue(secretId: string): Promise<string> {
    const result = await this.http.get<SecretValue>(`/orgs/${this.orgId}/secrets/${secretId}/value${this.envQ()}`);
    return result.value;
  }

  async getValueByName(name: string): Promise<string> {
    const result = await this.http.get<SecretValue>(
      `/orgs/${this.orgId}/secrets/by-name/${encodeURIComponent(name)}/value${this.envQ()}`
    );
    return result.value;
  }

  async create(input: CreateSecretInput): Promise<Secret> {
    return this.http.post(`/orgs/${this.orgId}/secrets`, input);
  }

  async update(secretId: string, value: string): Promise<Secret> {
    return this.http.patch(`/orgs/${this.orgId}/secrets/${secretId}${this.envQ()}`, { value });
  }

  async delete(secretId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/secrets/${secretId}`);
  }

  async versions(secretId: string): Promise<SecretVersion[]> {
    return this.http.get(`/orgs/${this.orgId}/secrets/${secretId}/versions`);
  }

  /**
   * Rotate a secret — creates a new version with a new value.
   * If no value is provided, one is auto-generated based on the secret type.
   */
  async rotate(secretId: string, newValue?: string): Promise<{ secretId: string; name: string; version: number }> {
    return this.http.post(`/orgs/${this.orgId}/secrets/${secretId}/rotate${this.envQ()}`, {
      ...(newValue ? { value: newValue } : {}),
    });
  }

  /**
   * Create a one-time, time-limited share link for a secret.
   *
   * The link can be viewed exactly once and expires after the specified TTL.
   * Default TTL is 24 hours (86400 seconds).
   */
  async share(
    secretId: string,
    ttlSeconds?: number
  ): Promise<{ share_url: string; share_token: string; expires_at: string }> {
    return this.http.post(`/orgs/${this.orgId}/secrets/${secretId}/share`, {
      ttlSeconds: ttlSeconds || 86400,
    });
  }

  /**
   * Mint a rotating handle for a named secret.
   *
   * The handle is a short-lived token (default 5 min) that maps to the real secret.
   * Resolve it via `resolveHandle()` or through the FyVault local proxy.
   * Even if the handle is captured from process memory, it expires automatically.
   */
  async getHandle(name: string, ttlSeconds?: number): Promise<SecretHandle> {
    return this.http.post(`/orgs/${this.orgId}/secrets/by-name/${encodeURIComponent(name)}/handle`, {
      ttlSeconds: ttlSeconds ?? 300,
    });
  }

  /**
   * Resolve a rotating handle to the real secret value.
   *
   * Use this when you need the plaintext value server-side (e.g., in the local proxy).
   * The handle must not be expired or revoked.
   */
  async resolveHandle(handle: string): Promise<string> {
    const result = await this.http.post<SecretValue>(
      `/orgs/${this.orgId}/handles/resolve`,
      { handle }
    );
    return result.value;
  }

  /**
   * Revoke a handle before its natural TTL expiry.
   */
  async revokeHandle(handleId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/handles/${handleId}`);
  }

  // ── Dependencies ────────────────────────────────────

  /**
   * Add a dependency between two secrets.
   * When the source secret rotates, the target can optionally cascade.
   */
  async addDependency(
    secretId: string,
    targetSecretId: string,
    type: string = "rotates_with",
    autoCascade: boolean = false
  ): Promise<{ id: string; sourceSecretId: string; targetSecretId: string; type: string; autoCascade: boolean }> {
    return this.http.post(`/orgs/${this.orgId}/secrets/${secretId}/dependencies`, {
      targetSecretId,
      type,
      autoCascade,
    });
  }

  /**
   * List upstream and downstream dependencies for a secret.
   */
  async listDependencies(secretId: string): Promise<{
    upstream: Array<{ id: string; sourceSecretId: string; targetSecretId: string; type: string; autoCascade: boolean }>;
    downstream: Array<{ id: string; sourceSecretId: string; targetSecretId: string; type: string; autoCascade: boolean }>;
  }> {
    return this.http.get(`/orgs/${this.orgId}/secrets/${secretId}/dependencies`);
  }

  /**
   * Remove a dependency by its ID.
   */
  async removeDependency(secretId: string, depId: string): Promise<void> {
    return this.http.delete(`/orgs/${this.orgId}/secrets/${secretId}/dependencies/${depId}`);
  }
}

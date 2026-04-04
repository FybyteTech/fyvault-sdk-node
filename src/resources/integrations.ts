import type { HttpClient } from "../http.js";

interface SyncResult {
  platform: string;
  synced: number;
  failed: number;
  errors: string[];
}

interface GenerateResult {
  format: string;
  filename: string;
  content: string;
  count: number;
}

interface ImportResult {
  created: number;
  skipped: number;
  overwritten: number;
}

export class IntegrationsResource {
  constructor(private http: HttpClient, private orgId: string) {}

  async sync(platform: string, environmentId: string, config: Record<string, string>): Promise<SyncResult> {
    return this.http.post(`/orgs/${this.orgId}/integrations/sync`, { platform, environmentId, config });
  }

  async generate(format: string, environmentId: string, options?: Record<string, string>): Promise<GenerateResult> {
    return this.http.post(`/orgs/${this.orgId}/integrations/generate`, { format, environmentId, options });
  }

  async importFromProvider(provider: string, content: string, environmentId: string, duplicateStrategy?: string): Promise<ImportResult> {
    return this.http.post(`/orgs/${this.orgId}/integrations/import`, {
      provider, content, environmentId, duplicateStrategy: duplicateStrategy || "skip",
    });
  }

  async notify(platform: string, config: Record<string, string>, message: string): Promise<void> {
    await this.http.post(`/orgs/${this.orgId}/integrations/notify`, { platform, config, message });
  }
}

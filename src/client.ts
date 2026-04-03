import { HttpClient } from "./http.js";
import { SecretsResource } from "./resources/secrets.js";
import { DevicesResource } from "./resources/devices.js";
import { OrgsResource } from "./resources/orgs.js";

export interface FyVaultOptions {
  apiKey: string;
  orgId: string;
  baseUrl?: string;
}

export class FyVault {
  public secrets: SecretsResource;
  public devices: DevicesResource;
  public orgs: OrgsResource;

  constructor(opts: FyVaultOptions) {
    const http = new HttpClient(
      opts.apiKey,
      opts.baseUrl || "https://api.fyvault.dev/api/v1"
    );
    const orgId = opts.orgId;
    this.secrets = new SecretsResource(http, orgId);
    this.devices = new DevicesResource(http, orgId);
    this.orgs = new OrgsResource(http, orgId);
  }
}

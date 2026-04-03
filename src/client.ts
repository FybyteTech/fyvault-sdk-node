import { HttpClient } from "./http.js";
import { SecretsResource } from "./resources/secrets.js";
import { DevicesResource } from "./resources/devices.js";
import { OrgsResource } from "./resources/orgs.js";
import { AccessTokensResource } from "./resources/accessTokens.js";
import { EnvironmentsResource } from "./resources/environments.js";

export interface FyVaultOptions {
  apiKey: string;
  orgId: string;
  baseUrl?: string;
  /** Optional environment name or ID. When set, all secret operations are scoped to this environment. */
  environment?: string;
}

export class FyVault {
  public secrets: SecretsResource;
  public devices: DevicesResource;
  public orgs: OrgsResource;
  public accessTokens: AccessTokensResource;
  public environments: EnvironmentsResource;

  constructor(opts: FyVaultOptions) {
    const http = new HttpClient(
      opts.apiKey,
      opts.baseUrl || "https://api.fyvault.com/api/v1"
    );
    const orgId = opts.orgId;
    this.secrets = new SecretsResource(http, orgId, opts.environment);
    this.devices = new DevicesResource(http, orgId);
    this.orgs = new OrgsResource(http, orgId);
    this.accessTokens = new AccessTokensResource(http, orgId);
    this.environments = new EnvironmentsResource(http, orgId);
  }
}

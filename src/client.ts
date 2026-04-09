import { HttpClient } from "./http.js";
import { SecretsResource } from "./resources/secrets.js";
import { DevicesResource } from "./resources/devices.js";
import { OrgsResource } from "./resources/orgs.js";
import { AccessTokensResource } from "./resources/accessTokens.js";
import { auto, detectEnvironment, type AutoOptions } from "./auto.js";
import { EnvironmentsResource } from "./resources/environments.js";
import { ScannerResource } from "./resources/scanner.js";
import { IntegrationsResource } from "./resources/integrations.js";
import { AgentCredentialsResource } from "./resources/agentCredentials.js";
import { BreakGlassResource } from "./resources/breakGlass.js";
import { SandboxesResource } from "./resources/sandboxes.js";
import { ComplianceResource } from "./resources/compliance.js";
import { ProvidersResource } from "./resources/providers.js";

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
  public scanner: ScannerResource;
  public integrations: IntegrationsResource;
  public agentCredentials: AgentCredentialsResource;
  public breakGlass: BreakGlassResource;
  public sandboxes: SandboxesResource;
  public compliance: ComplianceResource;
  public providers: ProvidersResource;

  /**
   * Zero-config initialization. Automatically detects auth method,
   * organization, and environment from the runtime context.
   *
   * Auth detection order: agent token file → env vars → GitHub OIDC
   * Env detection: FYVAULT_ENV → platform signals (Vercel, Netlify, Railway, etc.) → NODE_ENV
   *
   * @example
   * const fv = await FyVault.auto();
   * const dbUrl = await fv.secrets.getValueByName("DATABASE_URL");
   */
  static auto(opts?: AutoOptions): Promise<FyVault> {
    return auto(opts);
  }

  /**
   * Detect the current environment from platform signals without creating a client.
   * Useful for debugging which environment FyVault would select.
   */
  static detectEnvironment = detectEnvironment;

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
    this.scanner = new ScannerResource(http, orgId);
    this.integrations = new IntegrationsResource(http, orgId);
    this.agentCredentials = new AgentCredentialsResource(http, orgId);
    this.breakGlass = new BreakGlassResource(http, orgId);
    this.sandboxes = new SandboxesResource(http, orgId);
    this.compliance = new ComplianceResource(http, orgId);
    this.providers = new ProvidersResource(http, orgId);
  }
}

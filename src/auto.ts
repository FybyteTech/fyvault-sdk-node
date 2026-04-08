/**
 * FyVault.auto() — Zero-config SDK initialization.
 *
 * Automatically detects:
 *  1. Authentication method (how to get a FyVault token)
 *  2. Organization ID
 *  3. Environment (dev/staging/prod)
 *
 * Auth detection order (first match wins):
 *  1. Agent token file (/var/run/fyvault/token or platform equivalent)
 *  2. GitHub Actions OIDC (ACTIONS_ID_TOKEN_REQUEST_URL is set)
 *  3. AWS IAM (AWS_LAMBDA_FUNCTION_NAME or ECS metadata)
 *  4. Environment variables (FYVAULT_API_KEY)
 *  5. Error with clear instructions
 *
 * Environment detection order (first match wins):
 *  1. FYVAULT_ENV (explicit override — always wins)
 *  2. Vercel: VERCEL_ENV → "production" | "preview" → "staging" | "development"
 *  3. Netlify: CONTEXT → "production" | "deploy-preview" → "staging" | "branch-deploy" → "development"
 *  4. Railway: RAILWAY_ENVIRONMENT_NAME
 *  5. Render: RENDER_SERVICE_TYPE + IS_PULL_REQUEST
 *  6. Fly.io: FLY_APP_NAME + FLY_REGION (present = production)
 *  7. AWS: AWS_LAMBDA_FUNCTION_NAME (present = production)
 *  8. GitHub Actions: GITHUB_REF_NAME → "main"/"master" = production, else development
 *  9. Heroku: NODE_ENV (Heroku sets this)
 * 10. Generic: NODE_ENV → "production" | "test" → "staging" | * → "development"
 * 11. Default: org's default environment (server-side resolution)
 *
 * Org ID detection:
 *  1. FYVAULT_ORG_ID (explicit)
 *  2. Agent token file contains org ID
 *  3. Error if not set
 */

import { FyVault, type FyVaultOptions } from "./client.js";
import { FyVaultError } from "./errors.js";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Environment Detection ────────────────────────────

interface DetectedEnv {
  name: string;
  source: string;
}

export function detectEnvironment(): DetectedEnv | null {
  const env = process.env;

  // 1. Explicit override — always wins
  if (env.FYVAULT_ENV) {
    return { name: env.FYVAULT_ENV, source: "FYVAULT_ENV" };
  }

  // 2. Vercel
  if (env.VERCEL === "1" || env.VERCEL_ENV) {
    const vercelEnv = env.VERCEL_ENV; // "production" | "preview" | "development"
    if (vercelEnv === "preview") return { name: "staging", source: "VERCEL_ENV=preview" };
    if (vercelEnv === "development") return { name: "development", source: "VERCEL_ENV=development" };
    return { name: "production", source: "VERCEL_ENV=production" };
  }

  // 3. Netlify
  if (env.NETLIFY === "true" || env.CONTEXT) {
    const ctx = env.CONTEXT; // "production" | "deploy-preview" | "branch-deploy" | "dev"
    if (ctx === "deploy-preview") return { name: "staging", source: "NETLIFY CONTEXT=deploy-preview" };
    if (ctx === "branch-deploy" || ctx === "dev") return { name: "development", source: `NETLIFY CONTEXT=${ctx}` };
    return { name: "production", source: "NETLIFY CONTEXT=production" };
  }

  // 4. Railway
  if (env.RAILWAY_ENVIRONMENT_NAME) {
    return { name: env.RAILWAY_ENVIRONMENT_NAME.toLowerCase(), source: "RAILWAY_ENVIRONMENT_NAME" };
  }
  if (env.RAILWAY_ENVIRONMENT) {
    return { name: env.RAILWAY_ENVIRONMENT.toLowerCase(), source: "RAILWAY_ENVIRONMENT" };
  }

  // 5. Render
  if (env.RENDER === "true") {
    if (env.IS_PULL_REQUEST === "true") return { name: "staging", source: "RENDER IS_PULL_REQUEST" };
    return { name: "production", source: "RENDER" };
  }

  // 6. Fly.io
  if (env.FLY_APP_NAME) {
    return { name: "production", source: "FLY_APP_NAME" };
  }

  // 7. AWS Lambda / ECS
  if (env.AWS_LAMBDA_FUNCTION_NAME || env.ECS_CONTAINER_METADATA_URI) {
    // Check if there's a stage in the function name (e.g., my-func-staging)
    const funcName = env.AWS_LAMBDA_FUNCTION_NAME || "";
    if (funcName.includes("staging") || funcName.includes("stag")) {
      return { name: "staging", source: "AWS_LAMBDA_FUNCTION_NAME (contains staging)" };
    }
    if (funcName.includes("dev") || funcName.includes("development")) {
      return { name: "development", source: "AWS_LAMBDA_FUNCTION_NAME (contains dev)" };
    }
    return { name: "production", source: "AWS_LAMBDA_FUNCTION_NAME" };
  }

  // 8. GitHub Actions
  if (env.GITHUB_ACTIONS === "true") {
    const ref = env.GITHUB_REF_NAME || env.GITHUB_REF || "";
    if (ref === "main" || ref === "master" || ref.startsWith("refs/tags/")) {
      return { name: "production", source: `GITHUB_REF=${ref}` };
    }
    if (ref === "staging" || ref === "stage") {
      return { name: "staging", source: `GITHUB_REF=${ref}` };
    }
    return { name: "development", source: `GITHUB_REF=${ref}` };
  }

  // 9. GitLab CI
  if (env.GITLAB_CI === "true" || env.CI_ENVIRONMENT_NAME) {
    if (env.CI_ENVIRONMENT_NAME) {
      return { name: env.CI_ENVIRONMENT_NAME.toLowerCase(), source: "CI_ENVIRONMENT_NAME" };
    }
    const branch = env.CI_COMMIT_BRANCH || "";
    if (branch === "main" || branch === "master") return { name: "production", source: "GITLAB main" };
    return { name: "development", source: `GITLAB ${branch}` };
  }

  // 10. Generic NODE_ENV
  if (env.NODE_ENV) {
    if (env.NODE_ENV === "production") return { name: "production", source: "NODE_ENV" };
    if (env.NODE_ENV === "test" || env.NODE_ENV === "staging") return { name: "staging", source: "NODE_ENV" };
    return { name: "development", source: "NODE_ENV" };
  }

  // 11. No detection — let server decide (returns null)
  return null;
}

// ─── Auth Detection ───────────────────────────────────

interface DetectedAuth {
  apiKey: string;
  source: string;
  orgId?: string;
}

const AGENT_TOKEN_PATHS = [
  "/var/run/fyvault/token",                           // Linux standard
  "/tmp/fyvault-token",                               // Fallback Linux/macOS
  path.join(process.env.HOME || "", ".fyvault/token"), // User-level
];

if (process.platform === "win32") {
  AGENT_TOKEN_PATHS.push(
    path.join(process.env.APPDATA || "", "fyvault", "token")
  );
}

interface AgentTokenFile {
  token: string;
  org_id?: string;
  environment?: string;
  expires_at?: string;
}

function tryReadAgentToken(): DetectedAuth | null {
  for (const tokenPath of AGENT_TOKEN_PATHS) {
    try {
      const content = fs.readFileSync(tokenPath, "utf-8").trim();

      // Try JSON format first
      try {
        const data = JSON.parse(content) as AgentTokenFile;
        if (data.token) {
          return {
            apiKey: data.token,
            orgId: data.org_id,
            source: `agent token file: ${tokenPath}`,
          };
        }
      } catch {
        // Not JSON — treat as raw token string
        if (content.startsWith("fv") && content.length > 20) {
          return { apiKey: content, source: `agent token file: ${tokenPath}` };
        }
      }
    } catch {
      // File doesn't exist or can't be read — try next
      continue;
    }
  }
  return null;
}

async function tryGitHubOIDC(baseUrl: string, orgId: string): Promise<DetectedAuth | null> {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

  if (!requestUrl || !requestToken) return null;

  try {
    // Step 1: Get OIDC token from GitHub
    const audience = "fyvault";
    const oidcUrl = `${requestUrl}&audience=${audience}`;
    const oidcRes = await fetch(oidcUrl, {
      headers: { Authorization: `Bearer ${requestToken}` },
    });
    if (!oidcRes.ok) return null;

    const oidcData = (await oidcRes.json()) as { value: string };
    const idToken = oidcData.value;

    // Step 2: Exchange OIDC token for FyVault session token
    const exchangeRes = await fetch(`${baseUrl}/auth/oidc/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, orgId }),
    });
    if (!exchangeRes.ok) return null;

    const exchangeData = (await exchangeRes.json()) as {
      success: boolean;
      data: { token: string; org_id: string };
    };
    if (!exchangeData.success) return null;

    return {
      apiKey: exchangeData.data.token,
      orgId: exchangeData.data.org_id,
      source: "GitHub Actions OIDC",
    };
  } catch {
    return null;
  }
}

function tryEnvVars(): DetectedAuth | null {
  const apiKey = process.env.FYVAULT_API_KEY || process.env.FYVAULT_TOKEN;
  if (!apiKey) return null;

  return {
    apiKey,
    orgId: process.env.FYVAULT_ORG_ID,
    source: "environment variable",
  };
}

// ─── FyVault.auto() ───────────────────────────────────

export interface AutoOptions {
  /** Override base URL (default: https://api.fyvault.com/api/v1) */
  baseUrl?: string;
  /** Override org ID (skips auto-detection) */
  orgId?: string;
  /** Override environment (skips auto-detection) */
  environment?: string;
  /** Override API key (skips auto-detection) */
  apiKey?: string;
}

export async function auto(opts?: AutoOptions): Promise<FyVault> {
  const baseUrl = opts?.baseUrl || process.env.FYVAULT_API_BASE || process.env.FYVAULT_BASE_URL || "https://api.fyvault.com/api/v1";

  // ── Step 1: Detect auth ──
  let auth: DetectedAuth | null = null;

  if (opts?.apiKey) {
    auth = { apiKey: opts.apiKey, source: "explicit option" };
  }

  if (!auth) auth = tryReadAgentToken();
  if (!auth) auth = tryEnvVars();

  // GitHub OIDC needs orgId, so try env vars first for orgId
  const orgId = opts?.orgId || auth?.orgId || process.env.FYVAULT_ORG_ID;

  if (!auth && orgId) {
    auth = await tryGitHubOIDC(baseUrl, orgId);
  }

  if (!auth) {
    throw new FyVaultError(
      [
        "FyVault.auto() could not find credentials.",
        "",
        "Tried (in order):",
        "  1. Agent token file (/var/run/fyvault/token)",
        "  2. FYVAULT_API_KEY environment variable",
        "  3. GitHub Actions OIDC (ACTIONS_ID_TOKEN_REQUEST_URL)",
        "",
        "To fix, do one of:",
        "  • Set FYVAULT_API_KEY and FYVAULT_ORG_ID environment variables",
        "  • Install the fyvault agent (curl -fsSL https://get.fyvault.com | bash)",
        "  • Use the fybyte/fyvault-action in GitHub Actions",
        "",
        "Docs: https://fyvault.com/docs/quickstart",
      ].join("\n"),
      0,
      "AUTH_NOT_FOUND"
    );
  }

  // ── Step 2: Resolve org ID ──
  const resolvedOrgId = orgId || auth.orgId;
  if (!resolvedOrgId) {
    throw new FyVaultError(
      [
        "FyVault.auto() found credentials but no organization ID.",
        "",
        "Set FYVAULT_ORG_ID environment variable, or pass orgId to FyVault.auto({ orgId: '...' })",
      ].join("\n"),
      0,
      "ORG_NOT_FOUND"
    );
  }

  // ── Step 3: Detect environment ──
  let environment: string | undefined = opts?.environment;

  if (!environment) {
    const detected = detectEnvironment();
    if (detected) {
      environment = detected.name;
    }
    // If nothing detected, leave undefined — server resolves to org default
  }

  // ── Step 4: Create client ──
  return new FyVault({
    apiKey: auth.apiKey,
    orgId: resolvedOrgId,
    baseUrl,
    environment,
  });
}

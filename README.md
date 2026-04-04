# @fyvault/sdk

The official FyVault SDK for Node.js and TypeScript. Manage secrets, environments, rotating handles, integrations, and security scans programmatically.

## Install

```bash
npm install @fyvault/sdk
```

Or install from GitHub:

```bash
npm install github:FybyteTech/fyvault-sdk-node
```

## Quick Start

```typescript
import { FyVault } from "@fyvault/sdk";

const fv = new FyVault({
  apiKey: process.env.FYVAULT_API_KEY,    // fv_live_...
  orgId: process.env.FYVAULT_ORG_ID,
  environment: "production",              // optional — defaults to org default
});

// Fetch a secret value
const dbUrl = await fv.secrets.getValueByName("DATABASE_URL");
```

## Features

### Secrets

```typescript
// List all secrets in the current environment
const secrets = await fv.secrets.list();

// Get value by name
const value = await fv.secrets.getValueByName("STRIPE_KEY");

// Create a secret
await fv.secrets.create({
  name: "API_KEY",
  secretType: "API_KEY",
  value: "sk_live_...",
});

// Update
await fv.secrets.update(secretId, "new-value");

// Delete
await fv.secrets.delete(secretId);

// Versions
const versions = await fv.secrets.versions(secretId);
```

### Secret Rotation

```typescript
// Rotate with auto-generated value
const result = await fv.secrets.rotate(secretId);
// result = { secretId, name, version: 4 }

// Rotate with custom value
await fv.secrets.rotate(secretId, "new-custom-value");
```

### Rotating Handles

Short-lived tokens that map to real secrets. Even if captured, they expire in minutes.

```typescript
// Mint a handle (default 5 min TTL)
const handle = await fv.secrets.getHandle("STRIPE_KEY", 300);
// handle.handle = "fvh_a8f3c9..." (expires in 5 min)

// Resolve handle to real value
const realValue = await fv.secrets.resolveHandle(handle.handle);

// Revoke early
await fv.secrets.revokeHandle(handle.handle_id);
```

### Local Proxy

Route HTTP requests through a local proxy that resolves handles to real credentials:

```typescript
import { FyVault, SecretProxy } from "@fyvault/sdk";

const fv = new FyVault({ apiKey: "...", orgId: "..." });
const proxy = new SecretProxy(fv);
const { port, stop } = await proxy.start();

// Route requests through localhost:{port}
// Proxy resolves fvh_ handles in Authorization headers
stop(); // cleanup
```

### Environments

```typescript
// List environments
const envs = await fv.environments.list();

// Create
await fv.environments.create({ name: "preview", description: "PR previews" });

// Set default
await fv.environments.setDefault(envId);

// Delete
await fv.environments.delete(envId);
```

### Session Tokens

Mint scoped, time-limited tokens from your API key:

```typescript
// Mint a session token (15 min, read-only)
const session = await fv.accessTokens.create({
  ttlSeconds: 900,
  scopes: ["SECRETS_READ"],
});

// Use in a different context
const runner = new FyVault({
  apiKey: session.token,  // fvsess_...
  orgId: "org_acme",
});
```

### Security Scanner

Scan text for leaked secrets:

```typescript
const findings = await fv.scanner.scanText(suspiciousText);
// findings = [{ pattern_name, matched_text, line_number, confidence }]
```

### Integrations

Sync secrets to hosting platforms, generate infra configs, import from other vaults:

```typescript
// Sync to Vercel
await fv.integrations.sync("vercel", envId, {
  token: vercelToken,
  projectId: "prj_xxx",
});

// Generate Kubernetes manifest
const k8s = await fv.integrations.generate("k8s", envId, { name: "app-secrets" });

// Import from Doppler
await fv.integrations.importFromProvider("doppler", dopplerJson, envId);

// Send Slack notification
await fv.integrations.notify("slack", { webhookUrl: "..." }, "Secret rotated");
```

### Devices

```typescript
const devices = await fv.devices.list();
await fv.devices.register({ name: "prod-1", fingerprint: "fp_..." });
await fv.devices.assignSecret(deviceId, secretId);
await fv.devices.unassignSecret(deviceId, secretId);
await fv.devices.revoke(deviceId);
```

## Error Handling

```typescript
import { FyVault, FyVaultError } from "@fyvault/sdk";

try {
  await fv.secrets.getValueByName("MISSING");
} catch (err) {
  if (err instanceof FyVaultError) {
    console.error(err.status);   // 404
    console.error(err.code);     // "NOT_FOUND"
    console.error(err.message);  // "Secret not found"
  }
}
```

## Environment Scoping

All secret operations are automatically scoped to the configured environment:

```typescript
// All calls go to the "staging" environment
const fv = new FyVault({
  apiKey: "fv_live_...",
  orgId: "org_acme",
  environment: "staging",
});

// This fetches the STAGING value, not production
const dbUrl = await fv.secrets.getValueByName("DATABASE_URL");
```

## API Reference

| Resource | Methods |
|----------|---------|
| `secrets` | `list`, `get`, `getByName`, `getValue`, `getValueByName`, `create`, `update`, `delete`, `versions`, `rotate`, `getHandle`, `resolveHandle`, `revokeHandle` |
| `environments` | `list`, `get`, `create`, `update`, `delete`, `setDefault` |
| `devices` | `list`, `get`, `register`, `update`, `revoke`, `assignSecret`, `unassignSecret` |
| `accessTokens` | `create`, `revoke` |
| `scanner` | `scanText` |
| `integrations` | `sync`, `generate`, `importFromProvider`, `notify` |
| `orgs` | `get` |

## Links

- [FyVault Dashboard](https://fyvault.com)
- [Documentation](https://fyvault.com/docs)
- [API Reference](https://fyvault.com/api-reference)
- [GitHub (Public Mirror)](https://github.com/FybyteTech/fyvault-sdk-node)

## License

Proprietary. Copyright 2026 Fybyte.

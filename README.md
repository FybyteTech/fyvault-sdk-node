# @fyvault/sdk

Official Node.js / TypeScript SDK for [FyVault](https://fyvault.com).

## Install

From npm (when published):

```bash
npm install @fyvault/sdk
```

From this repository (build runs on install via `prepare`):

```bash
npm install github:FybyteTech/fyvault-sdk-node
```

Local path / monorepo:

```bash
npm install file:../path/to/sdks/node
```

## Usage

```typescript
import { FyVault, FyVaultError } from "@fyvault/sdk";

const client = new FyVault({
  apiKey: process.env.FYVAULT_API_KEY!,
  orgId: process.env.FYVAULT_ORG_ID!,
  baseUrl: process.env.FYVAULT_API_BASE, // optional; defaults to https://api.fyvault.com/api/v1
});

// Metadata
const secrets = await client.secrets.list();
const one = await client.secrets.get(secretId);
const byName = await client.secrets.getByName("MY_SECRET");

// Plaintext values (server-encrypted secrets; requires SECRETS_READ)
const value = await client.secrets.getValue(secretId);
const valueByName = await client.secrets.getValueByName("MY_SECRET");

// Create / update / delete (requires SECRETS_WRITE where applicable)
await client.secrets.create({
  name: "MY_SECRET",
  secretType: "GENERIC",
  value: "secret-value",
  injectionConfig: {},
});

// Short-lived session token (mint with fv_live_ key; use returned token as apiKey in a second client)
const session = await client.accessTokens.create({ ttlSeconds: 900 });
const ephemeral = new FyVault({
  apiKey: session.token,
  orgId: process.env.FYVAULT_ORG_ID!,
  baseUrl: process.env.FYVAULT_API_BASE,
});
await ephemeral.secrets.list();
```

### Errors

Failed API calls throw `FyVaultError` with `status`, `code`, and `message`.

## Related

- [fyvault](https://github.com/FybyteTech/fyvault) — Monorepo (API, dashboard, this SDK source)
- [fyvault-sdk-node](https://github.com/FybyteTech/fyvault-sdk-node) — Public mirror of this package

## License

Proprietary. All rights reserved.

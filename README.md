# @fyvault/sdk

Official Node.js / TypeScript SDK for [FyVault](https://fyvault.com).

## Install

```bash
npm install @fyvault/sdk
```

## Usage

```typescript
import { FyVault } from '@fyvault/sdk';

const client = new FyVault({ apiKey: 'your-api-key' });

// List secrets
const secrets = await client.secrets.list();

// Get a secret
const secret = await client.secrets.get('my-secret');
```

## Related

- [fyvault-cloud](https://github.com/fybyte/fyvault-cloud) — Cloud API
- [fyvault-python](https://github.com/fybyte/fyvault-python) — Python SDK
- [fyvault-agent](https://github.com/fybyte/fyvault-agent) — Agent & CLI
- [fyvault](https://github.com/fybyte/fyvault) — Frontend dashboard

## License

Proprietary. All rights reserved.

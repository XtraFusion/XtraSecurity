# XtraSecurity Node.js SDK

[![npm version](https://badge.fury.io/js/xtra-node-sdk.svg)](https://www.npmjs.com/package/xtra-node-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official Node.js client for [XtraSecurity](https://xtrasecurity.dev) — securely access your environment secrets in any Node.js application.

---

## Installation

```bash
npm install xtra-node-sdk
# or
yarn add xtra-node-sdk
```

---

## Quick Start

```typescript
import { XtraClient } from 'xtra-node-sdk';

const client = new XtraClient({
  token: process.env.XTRA_TOKEN,
  projectId: process.env.XTRA_PROJECT_ID,
});

// Inject all production secrets into process.env
await client.injectSecrets('production');

// Your app now has access to the secrets
console.log(process.env.DATABASE_URL);
```

---

## Authentication

Generate an API token from your [XtraSecurity dashboard](https://xtrasecurity.dev/settings/api-keys) and pass it to the client.

**Option 1: In-code (not recommended for production)**
```typescript
const client = new XtraClient({ token: 'xsk_live_...' });
```

**Option 2: Environment Variable (recommended)**
```bash
XTRA_TOKEN=xsk_live_... node your-app.js
```

**Option 3: Local config file**
After running `xtra login` with the CLI, the SDK automatically reads from `~/.xtra/config.json`.

---

## API Reference

### `new XtraClient(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `token` | `string` | `XTRA_TOKEN` env var | Your API token |
| `projectId` | `string` | `XTRA_PROJECT_ID` env var | Default project ID |
| `apiUrl` | `string` | `https://xtrasecurity.dev/api` | Custom API endpoint |
| `cache` | `boolean` | `true` | Enable in-memory caching |
| `cacheTtl` | `number` | `30000` | Cache TTL in milliseconds |

---

### `client.getAllSecrets(env, options?)`

Fetch all secrets for an environment as a `Record<string, string>`.

```typescript
const secrets = await client.getAllSecrets('production', { branch: 'main' });
// { DATABASE_URL: 'postgres://...', API_KEY: 'sk-...' }
```

**Parameters:**
- `env`: `'development' | 'staging' | 'production'`
- `options.branch`: Branch name (default: `'main'`)
- `options.projectId`: Override the default project
- `options.noCache`: Skip the in-memory cache

---

### `client.getSecret(key, env, options?)`

Fetch the value of a single secret.

```typescript
const dbUrl = await client.getSecret('DATABASE_URL', 'production');
if (!dbUrl) throw new Error('Missing DATABASE_URL!');
```

---

### `client.injectSecrets(env, options?)`

Inject all secrets from an environment directly into `process.env`. This is the easiest way to bootstrap your application.

```typescript
// At app startup, before any other code:
await client.injectSecrets('production');

// Secrets are now available as standard env vars
const app = express();
app.listen(process.env.PORT || 3000);
```

**Options:**
- `override`: If `true`, overwrites existing `process.env` values. Defaults to `false`.

---

### `client.setSecret(key, value, env, options?)`

Create or update a single secret.

```typescript
await client.setSecret('JWT_SECRET', 'new-super-secret-value', 'staging');
```

---

### `client.setSecrets(secrets, env, options?)`

Bulk create or update multiple secrets.

```typescript
await client.setSecrets(
  {
    DATABASE_URL: 'postgres://prod-host:5432/mydb',
    REDIS_URL: 'redis://prod-cache:6379',
    STRIPE_SECRET: 'sk_live_...',
  },
  'production',
  { branch: 'release/v2' }
);
```

---

### `client.listProjects()`

Return a list of all projects accessible to the authenticated user.

```typescript
const projects = await client.listProjects();
projects.forEach(p => console.log(p.name, p.id));
```

---

### `client.clearCache()`

Manually clear the in-memory secrets cache.

```typescript
client.clearCache();
```

---

## Error Handling

All methods throw `XtraError` on failure, which includes a `statusCode` and `code` for precise error handling:

```typescript
import { XtraClient, XtraError } from 'xtra-node-sdk';

try {
  const secret = await client.getSecret('MY_KEY', 'production');
} catch (err) {
  if (err instanceof XtraError) {
    console.error(`XtraSecurity error [${err.code}]: ${err.message}`);

    if (err.statusCode === 403) {
      console.error('Access denied. Check your permissions.');
    } else if (err.statusCode === 404) {
      console.error('Project or secret not found.');
    }
  }
}
```

---

## Examples

### Express App Bootstrap

```typescript
import express from 'express';
import { XtraClient } from 'xtra-node-sdk';

async function start() {
  const client = new XtraClient();
  await client.injectSecrets(process.env.NODE_ENV || 'development');

  const app = express();
  // process.env now contains all your secrets
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server running!');
  });
}

start().catch(console.error);
```

### Next.js / Runtime Fetch

```typescript
// lib/secrets.ts
import { XtraClient } from 'xtra-node-sdk';

let client: XtraClient | null = null;

function getClient() {
  if (!client) {
    client = new XtraClient({ cacheTtl: 60_000 }); // 1 min cache
  }
  return client;
}

export async function getDatabaseUrl() {
  return getClient().getSecret('DATABASE_URL', 'production');
}
```

### CI/CD Script

```typescript
// scripts/push-env.ts
import { XtraClient } from 'xtra-node-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new XtraClient({ projectId: 'proj_abc123' });

await client.setSecrets(
  Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('MY_APP_'))
  ),
  'staging'
);

console.log('✅ Secrets pushed to XtraSecurity!');
```

---

## License

MIT © XtraSecurity Team

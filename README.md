# Nado

Type it. Send it. Get paid.

Write an order the way you already text your customers — Nado turns it
into a proper invoice, a Monnify payment link, and a receipt, with your
sales tracked as you go. Built for the APIConf Lagos x Monnify Developer
Challenge.

Live: https://oja-invoice.vercel.app

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the env template and fill in the keys:

   ```bash
   cp .env.example .env
   ```

   Keys needed:

   | Key | Where to get it |
   | --- | --- |
   | `DATABASE_URL` | Pooled Postgres connection string (Neon recommended — create a free project at neon.tech) |
   | `DIRECT_URL` | Neon's direct/unpooled connection string, used by Prisma for migrations |
   | `MONNIFY_API_KEY` | Monnify merchant dashboard, switched to sandbox/test mode |
   | `MONNIFY_SECRET_KEY` | Same Monnify dashboard, sandbox/test mode |
   | `MONNIFY_CONTRACT_CODE` | Same Monnify dashboard, sandbox/test mode |
   | `MONNIFY_BASE_URL` | Defaults to Monnify's sandbox API base URL, no action needed for local dev |
   | `ANTHROPIC_API_KEY` | Anthropic Console: https://console.anthropic.com/settings/keys |
   | `NEXT_PUBLIC_APP_URL` | Defaults to `http://localhost:3000` locally; update once deployed |

3. Apply the existing database migrations (Prisma client is generated
   automatically on install via the `postinstall` script):

   ```bash
   pnpm exec prisma migrate deploy
   ```

4. Start the dev server:

   ```bash
   pnpm dev
   ```

   App runs at http://localhost:3000.

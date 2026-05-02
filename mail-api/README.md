# Mail API (Cloudflare Worker + Free-Tier Failover)

This worker enables direct mail delivery from the web app without opening a local mail program.
It uses provider failover:

- Primary: Resend
- Secondary (optional): Brevo

## 1) Prerequisites

- Cloudflare account
- Resend account + API key (primary)
- Optional Brevo account + API key (fallback)
- Verified sender domain/address for the provider you use

## 2) Configure

Edit `wrangler.toml`:

- `ALLOWED_ORIGIN`: frontend origin, e.g. `https://ztpgz.github.io`
- `FROM_EMAIL`: verified sender, e.g. `KAMA Services <noreply@kama-services.eu>`
- `MAIL_API_TOKEN`: optional shared token (recommended)

Set secret:

```bash
npx wrangler secret put RESEND_API_KEY
```

Optional fallback secret:

```bash
npx wrangler secret put BREVO_API_KEY
```

## 3) Deploy

```bash
npx wrangler deploy
```

The deploy output gives a URL like:

`https://kama-mail-api.<subdomain>.workers.dev`

## 4) Connect frontend

In `index.html` set:

```js
const MAIL_API_ENDPOINT = 'https://kama-mail-api.<subdomain>.workers.dev';
```

If you set `MAIL_API_TOKEN` in worker vars, send the same value in header `x-mail-api-token` from frontend.

## 5) Behavior in app

- PDF is still downloaded locally.
- If primary provider fails, worker tries fallback provider.
- If all providers fail or endpoint is empty: app falls back to `mailto:`.

## Request format (from frontend)

`multipart/form-data` fields:

- `to`: comma-separated recipients
- `subject`
- `text`
- `docNum`
- `pdf`: file blob

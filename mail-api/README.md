# Mail API (Cloudflare Worker + Resend)

This worker enables direct mail delivery from the web app without opening a local mail program.

## 1) Prerequisites

- Cloudflare account
- Resend account + API key
- Verified sender domain/address in Resend

## 2) Configure

Edit `wrangler.toml`:

- `ALLOWED_ORIGIN`: frontend origin, e.g. `https://ztpgz.github.io`
- `FROM_EMAIL`: verified sender, e.g. `KAMA Services <noreply@kama-services.eu>`

Set secret:

```bash
npx wrangler secret put RESEND_API_KEY
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

## 5) Behavior in app

- PDF is still downloaded locally.
- If `MAIL_API_ENDPOINT` is set and API call succeeds: mail is sent directly by server.
- If API fails or endpoint is empty: app falls back to `mailto:`.

## Request format (from frontend)

`multipart/form-data` fields:

- `to`: comma-separated recipients
- `subject`
- `text`
- `docNum`
- `pdf`: file blob

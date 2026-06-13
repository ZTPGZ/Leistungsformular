export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, allowedOrigin);
    }

    try {
      const mailMode = String(env.MAIL_MODE || 'live').toLowerCase();

      const fromParsed = parseFromAddress(env.FROM_EMAIL);
      if (!fromParsed) {
        return json({ ok: false, error: 'Server not configured (FROM_EMAIL missing or invalid)' }, 500, allowedOrigin);
      }

      if (env.MAIL_API_TOKEN) {
        const headerToken = request.headers.get('x-mail-api-token') || '';
        if (!headerToken || headerToken !== env.MAIL_API_TOKEN) {
          return json({ ok: false, error: 'Unauthorized' }, 401, allowedOrigin);
        }
      }

      const form = await request.formData();
      const requestType = (form.get('type') || 'document').toString().trim().toLowerCase();
      const toRaw = (form.get('to') || '').toString().trim();
      const subject = (form.get('subject') || '').toString().trim();
      const text = (form.get('text') || '').toString();
      const docNum = (form.get('docNum') || '').toString().trim();
      const pdf = form.get('pdf');

      if (!toRaw || !subject || !text) {
        return json({ ok: false, error: 'Missing required fields: to, subject, text' }, 400, allowedOrigin);
      }

      const to = toRaw
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

      if (!to.length) {
        return json({ ok: false, error: 'No valid recipients provided' }, 400, allowedOrigin);
      }

      const needsAttachment = requestType !== 'contact';
      let pdfBuffer = null;
      let filename = null;

      if (needsAttachment) {
        if (!pdf || typeof pdf.arrayBuffer !== 'function') {
          return json({ ok: false, error: 'Missing required field: pdf' }, 400, allowedOrigin);
        }
        pdfBuffer = await pdf.arrayBuffer();
        filename = `${docNum || 'Leistungsnachweis'}.pdf`;
      }

      if (mailMode === 'dry-run') {
        return json({
          ok: true,
          provider: 'worker-dry-run',
          dryRun: true,
          accepted: {
            type: requestType,
            to,
            subject,
            docNum,
            filename,
            pdfBytes: pdfBuffer ? pdfBuffer.byteLength : 0,
          },
        }, 200, allowedOrigin);
      }

      const pdfBase64 = pdfBuffer ? arrayBufferToBase64(pdfBuffer) : null;
      const attempts = [];

      if (env.SEND_EMAIL) {
        try {
          const msg = {
            from: { name: fromParsed.name, email: fromParsed.email },
            to: to.map(addr => ({ email: addr })),
            subject,
            content: [{ type: 'text/plain', value: text }],
          };

          if (pdfBase64 && filename) {
            msg.attachments = [{
              filename,
              content: pdfBase64,
              content_type: 'application/pdf',
            }];
          }

          await env.SEND_EMAIL.send(msg);
          attempts.push({ provider: 'cloudflare-email', ok: true });
          return json({ ok: true, provider: 'cloudflare-email', attempts }, 200, allowedOrigin);
        } catch (err) {
          attempts.push({ provider: 'cloudflare-email', ok: false, details: String(err?.message || err) });
        }
      } else {
        attempts.push({ provider: 'cloudflare-email', skipped: true, reason: 'SEND_EMAIL binding not configured' });
      }

      return json({ ok: false, error: 'Email send failed', attempts }, 502, allowedOrigin);
    } catch (err) {
      return json({ ok: false, error: 'Unexpected server error', details: String(err?.message || err) }, 500, allowedOrigin);
    }
  },
};

function parseFromAddress(raw) {
  if (!raw) return null;
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  if (raw.includes('@')) return { name: '', email: raw.trim() };
  return null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-mail-api-token',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

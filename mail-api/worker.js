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

      if (!env.FROM_EMAIL) {
        return json({ ok: false, error: 'Server not configured (FROM_EMAIL missing)' }, 500, allowedOrigin);
      }

      // Optional lightweight auth to prevent abuse of public worker endpoint.
      if (env.MAIL_API_TOKEN) {
        const headerToken = request.headers.get('x-mail-api-token') || '';
        if (!headerToken || headerToken !== env.MAIL_API_TOKEN) {
          return json({ ok: false, error: 'Unauthorized' }, 401, allowedOrigin);
        }
      }

      const form = await request.formData();
      const toRaw = (form.get('to') || '').toString().trim();
      const subject = (form.get('subject') || '').toString().trim();
      const text = (form.get('text') || '').toString();
      const docNum = (form.get('docNum') || '').toString().trim();
      const pdf = form.get('pdf');

      if (!toRaw || !subject || !text || !pdf || typeof pdf.arrayBuffer !== 'function') {
        return json({ ok: false, error: 'Missing required fields: to, subject, text, pdf' }, 400, allowedOrigin);
      }

      const to = toRaw
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

      if (!to.length) {
        return json({ ok: false, error: 'No valid recipients provided' }, 400, allowedOrigin);
      }

      const pdfBuffer = await pdf.arrayBuffer();
      const filename = `${docNum || 'Leistungsnachweis'}.pdf`;

      // Dry-run mode for end-to-end Worker/Wrangler testing without provider send.
      if (mailMode === 'dry-run') {
        return json({
          ok: true,
          provider: 'worker-dry-run',
          dryRun: true,
          accepted: {
            to,
            subject,
            docNum,
            filename,
            pdfBytes: pdfBuffer.byteLength,
          },
        }, 200, allowedOrigin);
      }

      const pdfBase64 = arrayBufferToBase64(pdfBuffer);

      const attempts = [];

      // Primary: Resend (free tier friendly for low volume)
      if (env.RESEND_API_KEY) {
        const resendResult = await sendViaResend(env, {
          to,
          subject,
          text,
          filename,
          pdfBase64,
        });
        attempts.push(resendResult.meta);
        if (resendResult.ok) {
          return json({ ok: true, provider: 'resend', id: resendResult.id || null, attempts }, 200, allowedOrigin);
        }
      } else {
        attempts.push({ provider: 'resend', skipped: true, reason: 'RESEND_API_KEY missing' });
      }

      // Secondary fallback: Brevo (optional, configure only if you want fallback)
      if (env.BREVO_API_KEY) {
        const brevoResult = await sendViaBrevo(env, {
          to,
          subject,
          text,
          filename,
          pdfBase64,
        });
        attempts.push(brevoResult.meta);
        if (brevoResult.ok) {
          return json({ ok: true, provider: 'brevo', id: brevoResult.id || null, attempts }, 200, allowedOrigin);
        }
      } else {
        attempts.push({ provider: 'brevo', skipped: true, reason: 'BREVO_API_KEY missing' });
      }

      return json({ ok: false, error: 'All providers failed', attempts }, 502, allowedOrigin);
    } catch (err) {
      return json({ ok: false, error: 'Unexpected server error', details: String(err?.message || err) }, 500, allowedOrigin);
    }
  },
};

async function sendViaResend(env, mail) {
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        attachments: [
          {
            filename: mail.filename,
            content: mail.pdfBase64,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const details = await safeText(resp);
      return {
        ok: false,
        meta: { provider: 'resend', ok: false, status: resp.status, details },
      };
    }

    const body = await resp.json().catch(() => ({}));
    return {
      ok: true,
      id: body?.id || null,
      meta: { provider: 'resend', ok: true, status: resp.status },
    };
  } catch (err) {
    return {
      ok: false,
      meta: { provider: 'resend', ok: false, status: 0, details: String(err?.message || err) },
    };
  }
}

async function sendViaBrevo(env, mail) {
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: parseSender(env.FROM_EMAIL),
        to: mail.to.map(email => ({ email })),
        subject: mail.subject,
        textContent: mail.text,
        attachment: [
          {
            name: mail.filename,
            content: mail.pdfBase64,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const details = await safeText(resp);
      return {
        ok: false,
        meta: { provider: 'brevo', ok: false, status: resp.status, details },
      };
    }

    const body = await resp.json().catch(() => ({}));
    return {
      ok: true,
      id: body?.messageId || null,
      meta: { provider: 'brevo', ok: true, status: resp.status },
    };
  } catch (err) {
    return {
      ok: false,
      meta: { provider: 'brevo', ok: false, status: 0, details: String(err?.message || err) },
    };
  }
}

function parseSender(fromEmail) {
  const m = String(fromEmail || '').match(/^\s*([^<]+)<([^>]+)>\s*$/);
  if (!m) return { email: String(fromEmail || '').trim() };
  return { name: m[1].trim(), email: m[2].trim() };
}

async function safeText(resp) {
  try {
    return await resp.text();
  } catch {
    return 'Request failed';
  }
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

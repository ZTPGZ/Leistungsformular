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

      let fromEmail = env.FROM_EMAIL;
      if (mailMode === 'test') {
        fromEmail = 'onboarding@resend.dev';
      }

      if (!fromEmail) {
        return json({ ok: false, error: 'Server not configured (FROM_EMAIL missing)' }, 500, allowedOrigin);
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

      if (env.RESEND_API_KEY) {
        const resendResult = await sendViaResend(env, {
          from: fromEmail,
          to,
          subject,
          text,
          filename: filename || undefined,
          pdfBase64: pdfBase64 || undefined,
        });
        attempts.push(resendResult.meta);
        if (resendResult.ok) {
          return json({ ok: true, provider: 'resend', id: resendResult.id || null, attempts }, 200, allowedOrigin);
        }
      } else {
        attempts.push({ provider: 'resend', skipped: true, reason: 'RESEND_API_KEY missing' });
      }

      return json({ ok: false, error: 'Resend failed', attempts }, 502, allowedOrigin);
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
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        ...(mail.filename && mail.pdfBase64
          ? {
              attachments: [
                {
                  filename: mail.filename,
                  content: mail.pdfBase64,
                },
              ],
            }
          : {}),
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

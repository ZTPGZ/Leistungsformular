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
      if (!env.RESEND_API_KEY) {
        return json({ ok: false, error: 'Server not configured (RESEND_API_KEY missing)' }, 500, allowedOrigin);
      }
      if (!env.FROM_EMAIL) {
        return json({ ok: false, error: 'Server not configured (FROM_EMAIL missing)' }, 500, allowedOrigin);
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
      const pdfBase64 = arrayBufferToBase64(pdfBuffer);
      const filename = `${docNum || 'Leistungsnachweis'}.pdf`;

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to,
          subject,
          text,
          attachments: [
            {
              filename,
              content: pdfBase64,
            },
          ],
        }),
      });

      if (!resendResp.ok) {
        const errText = await resendResp.text();
        return json({ ok: false, error: 'Resend request failed', details: errText }, 502, allowedOrigin);
      }

      const result = await resendResp.json();
      return json({ ok: true, provider: 'resend', id: result?.id || null }, 200, allowedOrigin);
    } catch (err) {
      return json({ ok: false, error: 'Unexpected server error', details: String(err?.message || err) }, 500, allowedOrigin);
    }
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

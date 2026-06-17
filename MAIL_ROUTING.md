# Mail-Routing Konzept – Cloudflare Worker für GitHub Pages + IONOS

## Übersicht

**Strategie:** Cloudflare Worker ist die **einzige zentrale Mail-API** für beide Deployments.
- **Frontend** (GitHub Pages ODER IONOS) → **Cloudflare Worker** → **Resend API** → **Empfänger**
- Keine PHP-Mail-Konfiguration auf IONOS nötig (optional als Fallback)

---

## Variante 1: GitHub Pages (aktuell – Testmodus)

### Setup
```yaml
Frontend:         https://ztpgz.github.io/Leistungsformular/
Mail-API:         https://kama-mail-api.kama-services.workers.dev
Resend Modus:     TEST (onboarding@resend.dev als Absender)
Empfänger:        zerotheprogamer@gmail.com (hardcoded in config.js)
```

### Aktueller Flow
```
Formular (index.html)
    ↓ POST /mail-api/send (FormData: PDF, subject, text)
Cloudflare Worker (worker.js)
    ↓ Resend API (Authorization: Bearer RESEND_API_KEY)
Resend SMTP
    ↓ nur an registrierte Test-Adresse
zerotheprogamer@gmail.com ✅
```

### Limitation
- Testmodus sendet **nur an zerotheprogamer@gmail.com**
- Absender ist `onboarding@resend.dev` (Resend-Default)
- Keine Domain-Verifikation nötig

---

## Variante 2: IONOS (Produktiv – Live-Modus)

### Setup
```yaml
Frontend:         https://app.kama-services.eu
Mail-API:         https://kama-mail-api.kama-services.workers.dev (gleicher Worker!)
Resend Modus:     LIVE
Absender:         noreply@kama-services.eu (verifizierte Domain)
Empfänger:        info@kama-services.eu + weitere
```

### Flow
```
Formular (index.html @ IONOS)
    ↓ POST zu Cloudflare Worker (gleiche URL wie GitHub Pages)
Cloudflare Worker (worker.js)
    ↓ Resend API
Resend SMTP (mit verifizierten DKIM-Keys)
    ↓ an beliebige Empfänger
info@kama-services.eu, andere@example.com ✅
```

### Voraussetzung: Domain-Verifikation auf Resend

#### 1. Resend Dashboard
- Einloggen: https://resend.com/domains
- "Add Domain" → `kama-services.eu`
- Resend zeigt 3 DNS-Einträge

#### 2. DNS-Einträge bei IONOS hinterlegen
Im IONOS Control Panel → "Domains & SSL" → `kama-services.eu` → "DNS-Einstellungen":

```dns
Typ   Host                        Wert                                  TTL
────────────────────────────────────────────────────────────────────────────
TXT   _resend                     [Resend Verification Token]          3600
CNAME resend._domainkey           [resend1234].resend.com.             3600
CNAME resend2._domainkey          [resend5678].resend.com.             3600
```

**Beispiel (echte Werte aus Resend Dashboard kopieren):**
```
TXT   _resend.kama-services.eu    re_verify_abc123def456
CNAME resend._domainkey           dkim1.resend.com
CNAME resend2._domainkey          dkim2.resend.com
```

#### 3. Verifizierung abwarten
- DNS-Propagation: 5-30 Minuten
- Resend Dashboard zeigt "Verified" ✅

#### 4. Cloudflare Worker-Config anpassen
```bash
cd mail-api
wrangler secret put FROM_EMAIL
# Eingabe: noreply@kama-services.eu

# wrangler.toml bearbeiten:
[env.production]
MAIL_MODE = "live"  # war vorher "test"
ALLOWED_ORIGIN = "https://app.kama-services.eu"
```

```bash
wrangler deploy
```

#### 5. Frontend-Config anpassen (`config.js` auf IONOS)
```js
window.KAMA_CONFIG = {
  mandatoryEmail: 'info@kama-services.eu',  // statt zerotheprogamer@gmail.com
  mailApiEndpoint: 'https://kama-mail-api.kama-services.workers.dev',
  mailApiToken: '',
};
```

---

## Deployment-Checkliste

### Für GitHub Pages (Testmodus)
- [x] Cloudflare Worker deployed
- [x] `MAIL_MODE = "test"`
- [x] `RESEND_API_KEY` gesetzt
- [x] `config.js`: `mandatoryEmail = zerotheprogamer@gmail.com`
- [ ] Test-Mail senden → prüfen ob ankommt

### Für IONOS (Live-Modus)
- [ ] Domain `kama-services.eu` auf Resend verifizieren (DNS-Einträge)
- [ ] `wrangler.toml`: `MAIL_MODE = "live"`
- [ ] `wrangler secret put FROM_EMAIL` → `noreply@kama-services.eu`
- [ ] Worker neu deployen: `wrangler deploy`
- [ ] `config.js` auf IONOS: `mandatoryEmail = info@kama-services.eu`
- [ ] Test-Mail senden → prüfen ob ankommt

---

## Vorteile dieser Lösung

✅ **Ein Worker für beide Deployments** (GitHub Pages + IONOS)
✅ **Keine PHP-Mail-Konfiguration** auf IONOS nötig (Worker übernimmt alles)
✅ **Zentrale Wartung** (nur Worker-Config ändern, nicht Frontend)
✅ **Kostenlos** (Cloudflare Worker Free: 100k Requests/Tag, Resend Free: 100 Mails/Tag)
✅ **DKIM/SPF automatisch** durch Resend (bessere Zustellbarkeit)

---

## Alternative: PHP-Mail als Fallback (optional)

Falls Cloudflare Worker ausfällt oder Resend-Limit erreicht wird:

```js
// index.html – mailToApi() Funktion erweitern
async function mailToApi(blob, data) {
  const primary = 'https://kama-mail-api.kama-services.workers.dev';
  const fallback = 'https://app.kama-services.eu/server/api/mail/send.php';
  
  try {
    // Primär: Cloudflare Worker
    const res = await fetch(primary, { method: 'POST', body: formData });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Cloudflare Worker failed, trying PHP fallback...');
  }
  
  // Fallback: PHP
  const res = await fetch(fallback, { method: 'POST', body: formData });
  return await res.json();
}
```

Dann muss aber `server/api/mail/send.php` auf IONOS deployed und konfiguriert werden.

---

## DNS-Zugriff für Kunde

**Wer kann DNS-Einträge bei IONOS ändern?**
- Domain-Inhaber (kama-services.eu)
- IONOS Control Panel Login nötig

**Falls Kunde keinen Zugriff hat:**
1. DNS-Einträge als Text per E-Mail schicken
2. Kunde beauftragt IONOS-Support (Ticket)
3. Oder: Subdomain `mail.kama-services.eu` an Cloudflare delegieren (NS-Records)

---

## Nächste Schritte

1. **Jetzt (GitHub Pages Testmodus):**
   - Test-Mail senden → prüfen ob bei `zerotheprogamer@gmail.com` ankommt
   
2. **Vor IONOS Go-Live:**
   - Mit Kunde klären: Wer hat DNS-Zugriff auf `kama-services.eu`?
   - Domain auf Resend verifizieren (DNS-Einträge hinterlegen)
   - Worker-Config auf `MAIL_MODE = "live"` umstellen
   - `FROM_EMAIL = noreply@kama-services.eu` setzen
   - Live-Test durchführen

3. **Optional:**
   - PHP-Mail-Backend als Fallback deployen (falls Worker ausfällt)

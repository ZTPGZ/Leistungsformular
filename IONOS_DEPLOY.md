# IONOS Deployment Guide – KAMA Leistungsnachweis

## Voraussetzungen
- IONOS Webhosting-Paket mit PHP-Support
- FTP/SFTP-Zugangsdaten oder Dateimanager im IONOS Control Panel
- Domain oder Subdomain (z.B. `app.kama-services.eu`)

---

## 1. Dateien hochladen

### Via FTP/SFTP:
1. Mit FTP-Client (FileZilla, WinSCP) verbinden
2. In das Web-Root-Verzeichnis navigieren (meist `/html`, `/htdocs` oder `/public_html`)
3. Folgende Dateien hochladen:
   ```
   /index.html
   /accounts.js
   /config.js
   /customers.js
   /assets/logo-main.svg
   /server/                    ← kompletter Ordner
   ```

### Via IONOS Dateimanager:
1. Im Control Panel: „Hosting" → „Dateien verwalten"
2. Dateien wie oben per Drag & Drop hochladen

---

## 2. Server-Backend konfigurieren

### `server/config.php` anpassen:
```php
return [
    // E-Mail-Absender (muss existierende Domain-Adresse sein)
    'mail_from' => 'noreply@kama-services.eu',
    'mail_reply_to' => 'info@kama-services.eu',

    // CORS: GitHub Pages + eigene Domain erlauben
    'allowed_origins' => 'https://ztpgz.github.io,https://app.kama-services.eu',

    // Datenbank (nur wenn User-Management genutzt wird)
    'db_host' => 'localhost',
    'db_name' => 'kama_app',
    'db_user' => 'kama_user',
    'db_pass' => 'SICHERES_PASSWORT',
];
```

**Wichtig:** `mail_from` muss eine E-Mail-Adresse der gehosteten Domain sein, sonst blockiert der Mailserver.

---

## 3. Frontend-Konfiguration

### `config.js` anpassen:
```js
window.KAMA_CONFIG = {
  mandatoryEmail: 'info@kama-services.eu',
  mailApiEndpoint: 'https://app.kama-services.eu/server/api/mail/send.php',
  mailApiToken: '', // leer lassen, wird vom PHP-Backend nicht benötigt
};
```

**Wichtig:** `mailApiEndpoint` muss auf das hochgeladene PHP-Skript zeigen.

---

## 4. Domain/Subdomain einrichten

### Im IONOS Control Panel:
1. **Subdomain anlegen** (falls noch nicht vorhanden):
   - „Domains & SSL" → „Subdomain hinzufügen"
   - Name: `app`
   - Zielordner: Dort wo `index.html` liegt

2. **SSL/HTTPS aktivieren**:
   - „Domains & SSL" → Domain auswählen → „SSL-Zertifikat aktivieren"
   - Kostenloses Let's Encrypt-Zertifikat nutzen
   - **HTTPS-Weiterleitung erzwingen** (empfohlen)

3. **www/non-www Weiterleitung** (optional):
   - `.htaccess` im Web-Root anlegen/bearbeiten:
     ```apache
     RewriteEngine On
     RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
     RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
     ```

---

## 5. Testen

### Checkliste:
- [ ] `https://app.kama-services.eu` öffnet die Login-Seite
- [ ] HTTPS-Zertifikat ist aktiv (grünes Schloss)
- [ ] Login funktioniert (Testuser aus `accounts.js`)
- [ ] Kundenauswahl-Dropdown zeigt Kunden aus `customers.js`
- [ ] PDF-Export erzeugt sauberes Layout (Logo, Gold-Linie, graue Tabellenköpfe)
- [ ] E-Mail-Versand funktioniert (Test-Mail an `info@kama-services.eu`)
- [ ] Signatur-Bestätigung Modal öffnet und schließt korrekt

### Fehlersuche:
- **Weißer Bildschirm:** Browser-Konsole öffnen (F12), Fehler prüfen
- **Mail-Versand fehlschlägt:** 
  - Prüfen ob `mail_from` in `server/config.php` korrekt ist
  - IONOS-Support kontaktieren, ob `mail()` freigeschaltet ist
- **CORS-Fehler:** `allowed_origins` in `server/config.php` muss die Frontend-URL enthalten

---

## 6. Wartung

### Kundenliste erweitern:
`customers.js` bearbeiten:
```js
window.KAMA_CUSTOMERS = [
  { name: 'Neuer Kunde GmbH' },
  // ... weitere Kunden
];
```

### Benutzer hinzufügen:
`accounts.js` bearbeiten (SHA-256 Hash des Passworts):
```js
window.KAMA_USERS = [
  { user: 'neueruser', pwdHash: 'SHA256_HASH', name: 'Neuer Mitarbeiter', initials: 'NM' },
];
```

Hash erzeugen: https://emn178.github.io/online-tools/sha256.html

---

## Offene Punkte
- [ ] Domain-Verifikation bei Resend (falls Cloudflare Worker weiter genutzt wird)
- [ ] IONOS Backup-Strategie einrichten
- [ ] Produktiv-Monitoring (Uptime, Logs)

---

**Support:** Bei Problemen IONOS-Hotline kontaktieren oder GitHub Issues öffnen.

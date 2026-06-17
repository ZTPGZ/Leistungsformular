# IONOS Deployment Guide – KAMA Leistungsnachweis

## Übersicht

**Diese Anleitung zeigt das komplette IONOS-native Deployment OHNE Cloudflare Worker oder Resend.**

Das IONOS Webhosting-Paket enthält **alles was du brauchst:**
- ✅ PHP `mail()` Funktion (für E-Mail-Versand)
- ✅ E-Mail-Postfächer (`info@kama-services.eu`)
- ✅ E-Mail-Weiterleitungen einrichtbar
- ✅ SSL-Zertifikate (Let's Encrypt kostenlos)
- ✅ Keine Drittanbieter-APIs nötig

---

## Voraussetzungen
- IONOS Webhosting-Paket mit PHP-Support
- FTP/SFTP-Zugangsdaten oder Dateimanager im IONOS Control Panel
- Domain oder Subdomain (z.B. `app.kama-services.eu`)
- E-Mail-Adresse der Domain (z.B. `noreply@kama-services.eu`)

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

## 2. E-Mail-Adresse anlegen (WICHTIG)

### Im IONOS Control Panel:
1. **"E-Mail & Office"** → Domain `kama-services.eu` auswählen
2. **E-Mail-Adresse erstellen:**
   - Adresse: `noreply@kama-services.eu` (für Absender)
   - Typ: **Postfach** oder **Weiterleitung**
   - Falls Weiterleitung: Ziel = `info@kama-services.eu`

3. **Optional: Weiterleitung für Empfänger:**
   - Adresse: `info@kama-services.eu`
   - Weiterleitung → `zerotheprogamer@gmail.com`
   - Dann kommen alle Leistungsnachweise direkt bei dir an

**Wichtig:** `mail_from` in `server/config.php` muss existierende E-Mail-Adresse sein, sonst blockiert IONOS den Versand.

---

## 3. Server-Backend konfigurieren

### `server/config.php` anpassen:
```php
<?php
return [
    // E-Mail-Absender (MUSS existierende E-Mail-Adresse der Domain sein!)
    'mail_from' => 'noreply@kama-services.eu',
    'mail_reply_to' => 'info@kama-services.eu',

    // CORS: Nur eigene Domain erlauben (für Sicherheit)
    // Wenn auch GitHub Pages erlaubt sein soll: 'https://ztpgz.github.io,https://app.kama-services.eu'
    'allowed_origins' => 'https://app.kama-services.eu',

    // Datenbank (nur wenn User-Management genutzt wird – kann ignoriert werden)
    'db_host' => 'localhost',
    'db_name' => 'kama_app',
    'db_user' => 'kama_user',
    'db_pass' => 'SICHERES_PASSWORT',
];
```

**Wichtig:** 
- `mail_from` muss in Schritt 2 angelegt worden sein
- PHP `mail()` nutzt IONOS-internen SMTP-Server (keine API-Keys nötig)

---

## 4. Frontend-Konfiguration

### `config.js` anpassen:
```js
window.KAMA_CONFIG = {
  mandatoryEmail: 'info@kama-services.eu',
  mailApiEndpoint: 'https://app.kama-services.eu/server/api/mail/send.php',
  mailApiToken: '', // leer lassen, wird nicht benötigt
};
```

**Wichtig:** 
- `mailApiEndpoint` zeigt auf das **lokale PHP-Skript** (nicht auf Cloudflare Worker!)
- Kein API-Token nötig (läuft auf gleichem Server)

---

## 5. Domain/Subdomain einrichten

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

## 6. Testen

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
  - Prüfen ob `noreply@kama-services.eu` in IONOS Control Panel angelegt ist
  - Prüfen ob `mail_from` in `server/config.php` korrekt ist
  - PHP-Fehlerlog prüfen (via FTP oder Dateimanager, meist `/logs/error.log`)
  - IONOS-Support kontaktieren: "Ist `mail()` Funktion aktiviert?"
- **CORS-Fehler:** `allowed_origins` in `server/config.php` muss `https://app.kama-services.eu` enthalten
- **PDF wird nicht versendet:** Browser-Konsole prüfen auf Upload-Fehler (Datei zu groß? Upload-Limit in PHP erhöhen)

---

## 7. Wartung

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

## E-Mail-Architektur (IONOS-native)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (index.html @ app.kama-services.eu)              │
└────────────────────┬────────────────────────────────────────┘
                     │ POST FormData (PDF + Meta)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  PHP Backend (server/api/mail/send.php)                    │
│  - Validierung (Empfänger, PDF-Attachment)                 │
│  - MIME Multipart (Text + PDF Base64)                      │
│  - mail($to, $subject, $body, $headers)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ SMTP
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  IONOS Mail-Server (intern)                                │
│  Absender: noreply@kama-services.eu                        │
└────────────────────┬────────────────────────────────────────┘
                     │ SMTP/Internet
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Empfänger: info@kama-services.eu                          │
│  ↓ (Weiterleitung optional)                                │
│  zerotheprogamer@gmail.com                                 │
└─────────────────────────────────────────────────────────────┘
```

**Vorteile:**
- ✅ Kein Cloudflare Worker nötig
- ✅ Kein Resend/Brevo/Drittanbieter
- ✅ Keine API-Keys zu verwalten
- ✅ Keine Domain-Verifikation (DNS-Einträge)
- ✅ 100% im IONOS-Paket enthalten
- ✅ Lokale Kommunikation (kein CORS-Problem)

---

## Offene Punkte
- [ ] IONOS Backup-Strategie einrichten (automatische Backups im Control Panel aktivieren)
- [ ] Produktiv-Monitoring (Uptime-Check mit UptimeRobot o.ä.)
- [ ] E-Mail-Logs prüfen (IONOS bietet Mail-Logs im Control Panel)

---

**Support:** Bei Problemen IONOS-Hotline kontaktieren oder GitHub Issues öffnen.

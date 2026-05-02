PHP + MySQL Benutzerverwaltung (all-inkl geeignet)

1) Voraussetzungen
- PHP 8.x mit PDO MySQL
- MySQL Datenbank bei all-inkl

2) Datenbank anlegen
- In all-inkl eine MySQL Datenbank anlegen.
- Datei server/setup.sql importieren.
- Danach gibt es noch keinen Benutzer.
- Ersten Admin im Bootstrap-Modus erstellen über users-admin.html.

3) Konfiguration
- server/config.php bearbeiten:
  - db_host, db_name, db_user, db_pass
  - allowed_origins
- Wenn Frontend und API auf derselben Domain laufen, allowed_origins kann * bleiben.
- Wenn Frontend auf GitHub Pages und API auf all-inkl läuft, allowed_origins auf exakte Frontend-URL setzen.

4) Deploy auf all-inkl
- Ordner server in den Webspace hochladen.
- APIs sind dann erreichbar unter:
  - /server/api/auth/login.php
  - /server/api/auth/logout.php
  - /server/api/auth/me.php
  - /server/api/users/list.php
  - /server/api/users/create.php
  - /server/api/users/update.php
  - /server/api/users/delete.php

5) Frontend aktivieren
- In index.html AUTH_API_BASE setzen, z. B.:
  /server/api
- Danach nutzt Login die PHP-API statt lokale accounts.js.

6) Ersten Admin erstellen
- users-admin.html aufrufen.
- Wenn keine Session vorhanden ist, startet die Seite im Bootstrap-Modus.
- Ersten Benutzer erstellen (wird automatisch admin).
- Danach normal einloggen und weitere Benutzer verwalten.

Sicherheitshinweise
- config.php nie mit echten Passwörtern öffentlich im Repo belassen.
- Admin-Startpasswort sofort ändern.
- HTTPS erzwingen.

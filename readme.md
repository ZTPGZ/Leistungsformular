# KAMA Services Leistungsnachweis (OnePager)

## Projektziel
Dieses Projekt digitalisiert den bestehenden papierbasierten Leistungsnachweis als mobile-optimierte Webanwendung (OnePager) im KAMA-Services-Design.

Die Anwendung bildet den Aufbau und die Felder der Vorlage aus den Assets ab und ergänzt den Prozess um Validierung, PDF-Erstellung und E-Mail-Vorbereitung.

## Funktionsumfang
- Mobile-First Benutzeroberflaeche mit responsiven Layouts
- Login mit Rollenmodell (Admin/Mitarbeiter)
- FSI-Leistungscodes mit Admin-Bearbeitung und permanenter Sichtbarkeit
- Pflichtfeld-Validierung vor dem Speichern
- Leistungsnachweis als PDF-Export
- E-Mail-Versandvorbereitung ueber lokalen Mail-Client (mailto)
- Pflichtempfaenger fuer jeden Versand: KamaServiceTest@gmail.com
- Eigener Abschnitt fuer Kunde nicht vor Ort
- Getrennte Unterschriftsbereiche fuer Mitarbeiter und Kunde
- Datenschutz- und Impressum-Dialoge mit Platzhaltertexten
- Zugangsdaten-vergessen-Dialog mit E-Mail-Anfrage

## Projektstruktur
- [index.html](index.html): Vollstaendige Anwendung (HTML, CSS, JavaScript)
- [assets](assets): Logos, Entwurfsvorlagen und visuelle Referenzen
- [TESTING_GUIDE.md](TESTING_GUIDE.md): Testleitfaden fuer Kundenabnahme

## Sicherheitshinweis
Die Anwendung ist eine statische Frontend-Anwendung. Bei rein statischem Hosting (z. B. GitHub Pages) koennen eingebettete Zugangsdaten prinzipiell eingesehen werden.

Fuer produktive Nutzung wird empfohlen:
- Authentifizierung ueber ein Backend
- Keine produktiven Passwoerter im Frontend
- Trennung von Test- und Produktionszugangsdaten

## GitHub Pages Deployment
Da dieses Verzeichnis aktuell noch kein eigenes Git-Repository ist, erfolgt das Deployment in zwei Schritten:

1. Repository auf GitHub anlegen (z. B. `leistungsformular`)
2. Lokal in diesem Ordner ausfuehren:

```bash
git init
git add .
git commit -m "Initial release: KAMA Leistungsnachweis"
git branch -M main
git remote add origin <DEIN_GITHUB_REPO_URL>
git push -u origin main
```

Danach in GitHub:
1. Settings -> Pages
2. Source: Deploy from a branch
3. Branch: `main`, Folder: `/ (root)`
4. Save

Die Seite ist danach unter der GitHub-Pages-URL des Repositories erreichbar.

## Test und Abnahme
Die fachliche Testdokumentation fuer Kunden befindet sich in [TESTING_GUIDE.md](TESTING_GUIDE.md).


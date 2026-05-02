# Kunden-Testleitfaden

## Ziel
Dieser Leitfaden unterstuetzt die strukturierte Abnahme der Anwendung durch den Kunden.

## Testumgebung
- Browser: Aktuelle Version von Chrome, Edge oder Firefox
- Geraete: Smartphone (Pflicht), Tablet (optional), Desktop (optional)
- Eingabegeraete: Touch oder Maus
- PDF-Viewer installiert
- Lokaler E-Mail-Client eingerichtet (fuer mailto-Funktion)

## Testvorbereitung
1. Anwendung im Browser oeffnen.
2. Browser-Cache bei Bedarf leeren.
3. Sicherstellen, dass Popups im Browser nicht blockiert werden.

## Abnahmekriterien
Die Abnahme gilt als erfolgreich, wenn alle Pflichttests in den Bereichen A bis G bestanden sind.

## A. Login und Rollen
1. Login mit gueltigem Account funktioniert.
2. Login mit ungueltigem Passwort zeigt Fehlermeldung.
3. Nach Login werden Name und Rolle korrekt angezeigt.
4. Logout beendet die Session und zeigt erneut den Login-Screen.

## B. Formular und Pflichtfelder
1. Pflichtfelder sind visuell erkennbar.
2. Speichern ohne Pflichtfelder wird blockiert.
3. Nach Korrektur kann gespeichert werden.
4. Eingaben bleiben waehrend des aktuellen Vorgangs stabil.

## C. FSI-Leistungscodes
1. FSI-Codes sind jederzeit sichtbar.
2. Admin kann FSI-Codes bearbeiten.
3. Geaenderte FSI-Codes werden gespeichert und erneut angezeigt.
4. Nicht-Admin hat keinen unberechtigten Bearbeitungszugriff.

## D. Kunde nicht vor Ort und Unterschriften
1. Bereich Kunde nicht vor Ort ist als eigener Abschnitt vorhanden.
2. Toggle wechselt den Status eindeutig.
3. Mitarbeiter-Unterschrift ist als eigener Bereich vorhanden.
4. Kunde-Unterschrift ist als eigener Bereich vorhanden.
5. Bei aktiviertem Kunde nicht vor Ort wird der Kunden-Unterschriftsbereich korrekt behandelt.

## E. PDF-Erzeugung
1. Leistungsnachweis erzeugt eine PDF ohne Fehlermeldung.
2. Wichtige Felder erscheinen in der PDF.
3. Datum, Fahrzeugdaten und Leistungen sind korrekt uebernommen.
4. PDF laesst sich oeffnen und speichern.

## F. E-Mail-Vorbereitung
1. E-Mail wird ueber mailto im lokalen Client geoeffnet.
2. KamaServiceTest@gmail.com ist immer als Empfaenger enthalten.
3. Betreff und Zusammenfassung sind vorbelegt.
4. Mehrere zusaetzliche Empfaenger koennen verwendet werden.

## G. Datenschutz und Impressum
1. Beide Dialoge sind ueber die Links erreichbar.
2. Dialoge lassen sich per Schliessen-Button, Escape und Klick ausserhalb schliessen.
3. Inhalte sind sichtbar und formal strukturiert.

## Optionaler Regressionstest
1. Seite neu laden, Session-Verhalten pruefen.
2. Erneute Datenerfassung und PDF-Erzeugung testen.
3. Erneuter E-Mail-Aufruf pruefen.

## Fehlerdokumentation
Pro Fehler bitte erfassen:
- Testbereich (A-G)
- Kurzbeschreibung
- Schritte zur Reproduktion
- Erwartetes Verhalten
- Tatsaechliches Verhalten
- Browser/Geraet
- Screenshot (falls vorhanden)

## Freigabeprotokoll
- Testdatum:
- Getestet von:
- Ergebnis: bestanden / bedingt bestanden / nicht bestanden
- Offene Punkte:
- Freigabe durch:

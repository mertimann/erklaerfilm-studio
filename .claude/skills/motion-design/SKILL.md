---
name: motion-design
description: Erklärvideo als flaches Motion Design in Remotion bauen — Formen, Zahlen und Typografie, deterministisch gerendert, ohne Videomodelle. Nutzen für Icon-/Flat-Design-Videos, SaaS und Zahlen-lastige Themen.
---

# Motion Design (Remotion)

Der einzige Stil OHNE Videomodelle — komplett in Code (Remotion/React),
deterministisch, jede Textänderung kostet nichts. Videomodelle können keine
flachen Volltonflächen (VAE-Artefakte auf harten Kanten, belegt) — deshalb
läuft dieser Stil über einen eigenen Renderer.

Referenzfall: `mograph/src/cases/waermewende/` (komplett), Prozess im Detail:
`mograph/ANLEITUNG.md`.

## Ablauf (Kurzform)
1. Skript erklärend (Mechanik + Schritte), `cases/<fall>/skript.json` mit `zeilen`
2. `python3 scripts/mg_vo.py cases/<fall>` — eine Aufnahme, Absatzgrenzen
3. Fall-Ordner in `mograph/src/cases/<fall>/` nach Wärmewende-Muster:
   `tokens.ts` (BEATS aus beats.json), `scenes/S01…`, Montage mit `<Series>`
   (harte Schnitte — Überblendungen schieben den Ton aus dem Takt!)
4. `cd mograph && npx remotion render src/index.ts <Fall> out/<fall>.mp4`
5. `python3 scripts/motion_qa.py` + Frame-Sweep

## Design-Regeln (gemessen an echten Referenzfilmen)
- EINE helle Farbwelt fürs ganze Video, Orange/eine Akzentfarbe, Kapitel-
  wechsel sparsam; kein Grün neben Orange
- Keine Sätze auf dem Bild — Zahlen, Objekt-Labels, Schrittmarken, dezente
  satzgenaue Untertitel mit Lichthof
- Jede Bewegung braucht einen Grund im Inhalt (Zahl zählt, Balken wächst,
  Haken wird gezeichnet); keine Kamera-Zooms, kein Dauerwackeln
- Bausteine in `mograph/src/bausteine/` (Kurven, Zahl, Haken, Zeichnet,
  Geräte, Figuren) — neue Objekte dort ergänzen, nie Bilder einbetten
- Fallen: TypeScript 7 bricht den Bundler (5.9.x ist gepinnt), HTML in SVG
  rendert nicht, PNG-Frames statt JPEG

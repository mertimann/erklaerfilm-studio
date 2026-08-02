# Motion-Design-Erklärvideo bauen — der Prozess

Diese Anleitung ist für den KI-Agenten (Claude Code, Codex), der im Auftrag
des Nutzers ein neues Erklärvideo baut. Sie ist aus einem realen Projekt
destilliert (`src/cases/waermewende/` — dort steht das vollständige Vorbild)
und enthält die Regeln, die dort teuer gelernt wurden. **Weiche nicht von den
Design-Regeln ab, bevor der Nutzer das erste Ergebnis gesehen hat.**

Voraussetzungen: Node ≥ 20, ffmpeg, Python 3 mit opencv/numpy/PIL,
`npm install` in `mograph/`, und `KIE_API_KEY` **als Umgebungsvariable des
Nutzers** — der Schlüssel gehört niemals in eine Datei dieses Repos.

---

## Ablauf in sieben Schritten

### 1. Skript schreiben — erklären, nicht behaupten

Ein Erklärvideo erklärt einen **Mechanismus** und einen **Ablauf**. Prüffrage
je Zeile: „Zeigt dieser Satz, WIE etwas funktioniert — oder behauptet er nur,
DASS etwas gut ist?" („Nicht mit uns", „Alles drin" = Behauptung, fällt durch.)

Bewährte Struktur (60–70 s, ~120 Wörter):
1. Mechanik des Produkts (was tut es, woher kommt der Nutzen, eine Zahl)
2. Das Problem (eine konkrete Zahl)
3. Die Lösung in einem Satz + „Und das geht so:"
4.–6. Drei nummerierte Schritte (der Ablauf)
7. Einwand entkräften (Service, Risiko)
8. Der Gewinn (die Zahl aus Beat 2 kehrt positiv zurück)
9. Marke, Angebot, eine Handlungsaufforderung

Jede Zeile = ein Absatz = eine Szene. Zahlen ausschreiben
(„fünfunddreißigtausend"), sonst hetzt die Stimme.

### 2. Fall anlegen

```
cases/<fall>/skript.json      {"stimme":"Charon","ton":"...","zeilen":[...9 Zeilen...]}
```

### 3. Stimme erzeugen — zwingend als EINE Aufnahme

```bash
python3 scripts/mg_vo.py cases/<fall>
```

Erzeugt `audio/full.wav` + `audio/beats.json` und legt die Aufnahme unter
`mograph/public/vo/<fall>.wav` ab. Warum eine Aufnahme: Einzelaufrufe pro
Szene ergaben messbar verschiedene Stimmen (F0 100–167 Hz). Das Skript kennt
die zweite Falle bereits: Szenengrenzen werden den Absätzen über den
Textanteil zugeordnet, nicht über „längste Pause".

### 4. Fall-Ordner in Remotion

`src/cases/<fall>/` nach dem Muster von `waermewende`:
- `tokens.ts` — re-exportiert `bausteine/basis` und enthält **nur** die
  gemessenen `BEATS` aus beats.json
- `scenes/S01.tsx … S09.tsx` — eine Datei pro Absatz
- `<Fall>.tsx` — Montage: `<Series>` mit harten Schnitten + **ein**
  `<Audio src={staticFile("vo/<fall>.wav")} />` ab Frame 0.
  Keine TransitionSeries: Überblendungen verkürzen die Zeitachse und
  schieben den Ton aus dem Takt.
- in `Root.tsx` registrieren.

### 5. Szenen bauen — die Design-Regeln

**Farbwelt.** EINE helle Welt für das ganze Video: Creme-Grund `#F4EFE6`,
Navy-Zeichnung `#17263F`/`#31456B`, Orange als einziger Akzent. Dazu höchstens
zwei Funktionsfarben an genau einer Stelle (z. B. Cyan = kalte Luft, Rot = der
Schmerzpunkt). Kapitelwechsel = einmal volles Orange (Lösung) und der warme
Abschluss. **Kein Grün neben Orange, keine dunklen Themenwechsel.**

**Text.** Keine Sätze auf dem Bild — die Stimme spricht sie. Erlaubt sind:
- EINE kurze Überschrift (2–5 Wörter) im Leerraum der Szene (`<Ueberschrift>`),
  ab ~Frame 8, damit man sofort weiß, worum es geht
- Zahlen (`<Zahl>` zählt hoch), Objekt-Labels (`<Label>`), Schrittmarken
  (`<Schritt>`)
- dezente Untertitel (`<Untertitel>`) mit dem gesprochenen Text, unten mittig,
  halbtransparent mit Lichthof — nie als Balken. Lange Sätze in 2 Segmente.

**Bewegung.** Jede Bewegung braucht einen Grund im Inhalt: die Zahl zählt,
weil der Preis steigt; der Stapel wächst, weil sich Raten sammeln; der Haken
wird gezeichnet, weil geprüft wird. **Keine Kamera-Zooms**, kein Dauerwackeln,
nichts rotiert dekorativ. Ausklingende Bewegung nur über `schwingt()` nach
einem Ereignis. Auftritte: ease-out (`E.auftritt`), Abgänge kürzer und ease-in.

**Bild.** Jede Szene zeigt eine Situation mit erkennbaren Gegenständen
(`bausteine/geraete.tsx`, `bausteine/welt.tsx`) — Gegenstände beschriften.
Schauplatz/Bildaufbau wechselt pro Szene (Totale, nah, Vorgang, Karte), aber
das Produkt bleibt dasselbe gezeichnete Objekt. Leerraum gezielt füllen:
Überschrift oben links, Zahl oder Karte im freien Bereich.

### 6. Rendern

```bash
cd mograph && npx remotion render src/index.ts <Fall> out/<fall>.mp4
```

Bekannte Fallen (alle schon bezahlt):
- TypeScript **7** bricht Remotions Bundler → `typescript@5.9.x` ist gepinnt
- HTML-/React-Komponenten innerhalb von `<svg>` rendern **nicht** (leere
  Stellen) — in SVG nur SVG-Elemente, Zahlen dort als `<text>` rechnen
- `Config.setVideoImageFormat("png")` lassen — JPEG macht Kanten weich

### 7. Prüfen — Frames ansehen ist Pflicht

```bash
python3 ../scripts/motion_qa.py out/<fall>.mp4     # Bewegungs-/Dichte-Messwerte
```

Danach **drei Frames pro Szene** ziehen (20 %, 55 %, 92 %) und selbst ansehen:
- Liegt Text auf ähnlich hellem/dunklem Grund? (häufigster Fehler)
- Steht eine Figur im Untertitel? Kollidiert ein Label mit einer Kontur?
- Ist eine Bildhälfte über Sekunden leer?
- Stimmen Szenenwechsel mit den Absätzen überein (Ton anhören)?

Erst wenn dieser Sweep sauber ist, bekommt der Nutzer das Video.

---

## Baustein-Übersicht (`src/bausteine/`)

| Baustein | Zweck |
|---|---|
| `basis.ts` | Format, Easing-Kurven `E`, Schrift, Standardpalette `C`, `f()` |
| `lib.tsx` | `p()` Fortschritt, `schwingt()`, `Zahl`, `Worte`, `Haken`, `Zeichnet` (Pfad zeichnet sich), `Balken`, `Aufdecken` |
| `ui.tsx` | `Ueberschrift`, `Untertitel` (mit Lichthof), `Schritt` (Nummernmarke) |
| `geraete.tsx` | `Aussengeraet` (Wärmepumpe, `an`/`defekt`), `Label`, `LuftStrom`, `FlussPunkte` (Punkte wandern einen Pfad entlang) |
| `welt.tsx` | Haus, Techniker (beweglicher Arm), Heizkörper, Bäume, Räume |

Für ein neues Produkt fehlende Gegenstände als neue SVG-Komponenten in
`geraete.tsx`/`welt.tsx` ergänzen — im selben Stil: Flächen + Navy-Kontur,
Parameter für den Zustand (`an`, `defekt`, `warm`), nie fertige Bilder einbetten.
Falls Illustrationen generiert werden sollen: `scripts/gen_art.py` (Stilanker,
Freistellung) — aber Vorgänge, die sich artikulieren müssen, immer als SVG.

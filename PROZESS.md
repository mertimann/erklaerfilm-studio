# Der Produktionsprozess (gilt für alle Video-KI-Stile)

Sieben Schritte. Die Reihenfolge ist nicht verhandelbar — jedes Gate hat
seinen Grund (teuer bezahlt).

## 0. Voraussetzungen
- `export KIE_API_KEY=...` (eigener Schlüssel von kie.ai — NIE in Dateien!)
- Python 3 mit `opencv-python numpy pillow`, ffmpeg
- Preise: 200 Credits = 1 USD. Richtwert pro 60–90-s-Film: 400–700 Credits
  (2–3,50 $), inkl. Stimme und Musik.

## 1. Konzept-Gate (mit dem Auftraggeber, BEVOR irgendwas generiert wird)
Erst die IDEE, dann die Szenen. Ein Konzept ist eine tragende Metapher oder
Story, kein Themenname. Drei-Akt: 0–15 % Setup/Problem, bis 75 % Eskalation,
Rest Auflösung + Marke. Variable Schnittlängen (1–7 s), Setup/Payoff,
Running Gag wenn möglich. Das Konzept als Tabelle (Szene/Dauer/BILD/TON)
zeigen und freigeben lassen.

## 2. Drehbuch → `cases/<fall>/skript.json`
`{"stil": "...", "ton": "...", "szenen": [{"vo", "bild", "motion",
optional "bild2/motion2", "bild3/motion3"}]}`.
- vo: deutsch, Zahlen ausschreiben, ~12 Zeichen/Sekunde
- bild: englisch, IMMER mit wörtlich wiederholten Figurenbeschreibungen
  („the debtor Bernd (chubby, walrus moustache, yellow polo)") und dem
  Deutschland-Zusatz („Distinctly GERMAN setting … nothing American")
- motion: was PASSIERT (Vorgang!), plus Stabilitätssätze („the number of X
  stays exactly N", „characters keep exactly the same faces throughout")

## 3. Stimme — EINE Aufnahme
`python3 scripts/ki_pipeline.py cases/<fall> vo`
Danach Sprechraten prüfen (6–24 Z/s je Absatz). Einzelaufnahmen pro Szene
ergeben messbar verschiedene Stimmen — deshalb immer eine Aufnahme.

## 4. Keyframes + GATE (Pflicht!)
`python3 scripts/ki_pipeline.py cases/<fall> kf`
Kontaktbogen bauen, JEDES Bild ansehen: Stiltreue, Figurenkontinuität,
deutsche Umgebung, kein Text im Bild. Ausreißer per Bild-zu-Bild gegen den
Anker regenerieren („Use EXACTLY the same character…"). ERST DANN Clips.

## 5. Clips
`python3 scripts/ki_pipeline.py cases/<fall> clips` (~18–27 Credits/Clip)

## 6. Schnitt + Ton
`python3 scripts/ki_pipeline.py cases/<fall> final`
Musik: 2 Suno-Tracks über `/api/v1/generate` (siehe ki_pipeline-Doku),
`ton.json` mit Spuren/Effekten anlegen, `python3 scripts/ton_mix.py cases/<fall>`.
Regeln: Musik-Stopp als Gag-Timing, Effekte auf den Schnitten, Bett -15
bis -17 dB unter der Stimme.

## 7. Sweep (Pflicht!)
Drift zeigt sich NUR im bewegten Material, nie am Keyframe: pro Einstellung
2 Frames ziehen (25 %/85 %) und vergleichen — vermehren sich Objekte?
Wechseln Frisuren? Reparatur: Clip neu würfeln mit Stabilitätssatz.
Erst wenn der Sweep sauber ist, wird geliefert.

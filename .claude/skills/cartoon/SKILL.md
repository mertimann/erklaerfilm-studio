---
name: cartoon
description: Erklärvideo im Cartoon-Stil bauen — runde, liebenswerte Figuren, B2C, verspielt. Nutzen wenn der User ein Cartoon-Erklärvideo mit Tieren oder Maskottchen will.
---

# Cartoon-Stil

Rundliche 2D-Figuren mit großen Augen, warme fröhliche Farben.
Referenz: `beispiele/pfotenpost/` (Tierfutter-Abo mit Hund + Katze).

## Ablauf
PROZESS.md, `"stil": "cartoon"`. 6–12 Einstellungen.

## Die eine Regel über allem: FIGURENKONTINUITÄT
Cartoon lebt von wiederkehrenden Figuren — und genau da driften Modelle am
stärksten (andere Rasse, andere Fellfarbe, plötzlich Hut).
- Jede Figur bekommt eine wörtliche Beschreibung, die in JEDEN Prompt kopiert
  wird („the golden puppy with white chest", „the grey-and-white cat")
- Szene 1 ist der Anker; ALLE weiteren Keyframes als Bild-zu-Bild dagegen
- Am Gate jede Figur in jedem Bild prüfen; Ausreißer mit
  „Use EXACTLY the same characters as the reference image" regenerieren
- Nach den Clips der Sweep: Modelle ändern Fellfarben auch MITTEN im Clip
- Story nicht vergessen: auch zwei Tiere brauchen einen Bogen (Problem →
  Entdeckung → Freude), sonst wird es eine Bildschleife

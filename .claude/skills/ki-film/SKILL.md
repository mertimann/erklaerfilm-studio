---
name: ki-film
description: Erklärvideo im fotorealen Film-Look bauen — wie echt gedrehte Werbung, mit surrealen Metaphern. Nutzen wenn der User einen realistischen, filmischen Spot ohne Illustration will.
---

# KI-Film (fotorealer Look)

Sieht aus wie eine on location gedrehte deutsche Werbung: natürliches Licht,
geringe Tiefenschärfe, gedeckte Farben. Referenz: `beispiele/nexoro/`
(Büro-KI-Assistent).

## Die Kernregel: SURREALE METAPHER statt Stock-B-Roll
Generisches Filmmaterial (leerer Schreibtisch, Drucker, tippende Hände)
bringt NULL Mehrwert — das war die teuerste Lektion dieses Stils. Jede Szene
braucht EIN kühnes Bild, das den gesprochenen Satz wörtlich übersetzt:
- „300 Mails" → der Mitarbeiter wird von einer Brieflawine begraben
- „sortiert von selbst" → Briefe fliegen in choreografierten Bahnen in Fächer
- „Sie behalten die Kontrolle" → Papierflieger warten schwebend vor einer
  Mini-Schranke auf den Fingertipp
- „Team verdoppelt" → neben ihm arbeitet sein durchscheinender Zwilling

## Regeln
- Fotoreale WIEDERKEHRENDE Figur = höchstes Driftrisiko: gleiche Kleidung,
  gleiche Frisur in jedem Prompt; heikle Szenen ohne Gesicht kadrieren
  (über die Schulter, Hände, Silhouette)
- Bildschirme IMMER defokussiert („softly glowing, out of focus") — lesbare
  UI/Texte kann kein Modell
- Deutsch verankern (Büros, Straßen, Kennzeichen), sonst rutscht alles ins
  Amerikanische
- Rechtlicher Hinweis: fotorealistische KI-Videos fallen unter die
  EU-Kennzeichnungspflicht (seit 08/2026), wenn sie veröffentlicht werden —
  in `skript.json` `"kennzeichnung": true` setzen, dann blendet die Pipeline
  „KI-generiertes Video" ein

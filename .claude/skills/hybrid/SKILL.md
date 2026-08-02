---
name: hybrid
description: Erklärvideo im Hybrid-Stil bauen — echte Fotos als Bühne, flache Cartoon-Figuren agieren darauf. Nutzen für regionale Betriebe (Handwerk, Garten, lokale Dienstleister).
---

# Hybrid-Stil

Fotorealistischer Hintergrund + klar gezeichnete 2D-Vektorfiguren MIT weichem
Schatten, damit sie in der Szene stehen. KEINE Kritzel-Overlays auf Fotos —
das ist der klassische Fehlgriff. Referenz: `beispiele/gruenwerk/` (Gartenbau).

## Ablauf
PROZESS.md, `"stil": "hybrid"`. 6–10 Einstellungen.

## Regeln
- Im Prompt beide Welten explizit trennen: „realistic bright photograph as
  background" + „flat vector cartoon characters composited INTO the photo"
- Wiederkehrende Figuren (z. B. der Gärtner mit grünem Polo + Kappe) wie im
  Cartoon-Stil hart locken — mit ZWEI Referenzen arbeiten, wenn Figuren aus
  verschiedenen Anker-Bildern stammen (image_urls nimmt mehrere)
- Motion: NUR die Cartoon-Figuren bewegen sich („Only the cartoon characters
  move; the photo stays almost still"), sonst verliert das Foto seinen Halt
- Vorher/Nachher-Split als Signature-Einstellung nutzen (halbes Bild trist,
  halbes schön, Figuren wechseln die Seite)

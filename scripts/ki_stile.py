#!/usr/bin/env python3
"""KI_STILE — die Stil-Presets der Keyframe→Video-Pipeline.

Jeder Stil besteht aus drei Teilen:
  stilblock    wortgleich in JEDEM Keyframe-Prompt (der Konsistenzanker)
  motion_stil  haengt an jedem Bewegungs-Prompt (die Kamerasprache des Stils)
  stimme/ton   Sprecherprofil, das zur Bildsprache passt

Die Auswahl folgt der Recherche: Videomodelle scheitern an harten Kanten und
Volltonflaechen, glaenzen aber bei Textur, Atmosphaere und malerischen Looks.
Deshalb gibt es hier Aquarell, Cinematic, KI, Cartoon und Hybrid - und bewusst
KEIN Flat/Icon (macht Remotion besser) und KEINE Isometrie (Modelle treffen
den Winkel nicht).
"""

STILE = {
    "aquarell": {
        "label": "Aquarell",
        "stimme": "Kore",
        "ton": ("Warme, ruhige deutsche Erzählerin. Sanft, nah, empathisch, "
                "wie ein Hörbuch. An Absatzenden eine deutliche Pause lassen."),
        "stilblock": (
            "Delicate watercolor illustration on textured paper, soft wet-on-wet "
            "washes, gentle colour bleeding, visible paper grain, muted warm "
            "palette of soft apricot, sage green and dusty blue, soft edges, "
            "tender storybook mood, generous white space. "),
        "motion_stil": (
            " Very gentle slow movement, watercolor pigments subtly breathing, "
            "soft light shifting, minimal camera drift. Calm and tender pace. "
            "Keep the watercolor style of the source image exactly."),
    },
    "cinematic": {
        "label": "Cinematic",
        "stimme": "Charon",
        "ton": ("Tiefer, ruhiger deutscher Erzähler mit Gewicht. Souverän, "
                "filmisch, kein Werbeton. An Absatzenden eine deutliche Pause."),
        # Nachgeschaerft am Referenzmaterial: KEIN Fotorealismus, KEIN 3D -
        # detailreiche realistische Vektor-Illustration mit Filmstill-Bildaufbau.
        "stilblock": (
            "Digital painting / cel-shaded poster illustration - ABSOLUTELY NOT a "
            "photograph, visibly hand-illustrated with painterly flat colour "
            "planes and crisp cel shadows: realistic human proportions and faces, "
            "bold dramatic lighting built from clean shadow shapes, cinematic "
            "film-still composition, rich moody colour grade. Flat vector "
            "shading, no outlines, no photo, no 3D render. Modern contemporary "
            "German setting, current-day machines and architecture. "),
        "motion_stil": (
            " The illustrated scene comes alive: subtle parallax between layers, "
            "light shifts slowly, characters make small deliberate movements. "
            "Slow cinematic camera. Keep the flat illustration style of the "
            "source image exactly - never let it become photographic."),
    },
    "ki": {
        "label": "KI-Stil",
        "stimme": "Charon",
        "ton": ("Klarer, moderner deutscher Erzähler. Präzise und zuversichtlich, "
                "warm. An Absatzenden eine deutliche Pause."),
        # Nachgeschaerft am Referenzmaterial: sieht aus wie ECHT GEDREHTE
        # Werbung - reale deutsche Schauplaetze, natuerliches Licht.
        "stilblock": (
            "Photorealistic cinematic footage like a high-end German corporate "
            "commercial shot on location: real modern German offices and people, "
            "natural window light, shallow depth of field, muted natural colour "
            "grade, 35mm film look, realistic skin and fabric. "
            "No CGI look, no neon, no holograms, no fantasy. "),
        "motion_stil": (
            " Natural realistic motion: subtle handheld micro-drift, people move "
            "calmly and believably, shallow focus breathes. Like real film "
            "footage. Keep the photorealistic look of the source image exactly."),
    },
    "cartoon": {
        "label": "Cartoon",
        "stimme": "Kore",
        "ton": ("Fröhliche, herzliche deutsche Erzählerin. Verspielt, aber klar. "
                "An Absatzenden eine deutliche Pause lassen."),
        "stilblock": (
            "Charming 2D cartoon illustration, expressive rounded characters "
            "with big friendly eyes, bold clean shapes, warm cheerful colours, "
            "soft shading, animated-feature appeal. "),
        "motion_stil": (
            " Lively cartoon animation: characters blink, ears twitch, tails wag, "
            "gentle bouncy motion, playful energy. "
            "Keep the cartoon style and the characters of the source image exactly."),
    },
    "hybrid": {
        "label": "Hybrid",
        "stimme": "Charon",
        "ton": ("Bodenständiger, freundlicher deutscher Erzähler. Direkt und "
                "sympathisch, regional geerdet. An Absatzenden eine Pause."),
        # Nachgeschaerft am Referenzmaterial: das Foto ist die Buehne,
        # darauf agieren FLACHE CARTOON-FIGUREN (keine Kritzel-Overlays).
        "stilblock": (
            "Mixed-media explainer style: a realistic bright photograph as the "
            "background scene, with one or two flat vector cartoon characters "
            "composited INTO the photo (clean rounded shapes, no outlines, "
            "friendly simple faces, limited palette, soft simple shadow under "
            "each character so they sit in the scene). The photo stays "
            "photographic and sharp, the characters are clearly 2D illustration. "
            "No doodles, no sketch lines, no drawn scribbles on the photo. "),
        "motion_stil": (
            " Only the cartoon characters move - they gesture, wave, take small "
            "steps, in simple smooth 2D animation. The photo background stays "
            "almost still, just tiny natural movement like leaves. Keep the "
            "photo-plus-cartoon mixed-media look of the source image exactly."),
    },
    "hollywood": {
        "label": "Hollywood",
        "stimme": "Charon",
        "ton": ("Tiefer deutscher Erzähler wie ein Kinotrailer-Sprecher, aber "
                "zurückgenommen: ruhig, trocken, mit Augenzwinkern. "
                "An Absatzenden eine deutliche Pause."),
        # Aus der Frame-Analyse der Referenz: realistische Proportionen als
        # Vektor-Illustration, Cel-Schatten, satte Farbwelt pro Schauplatz,
        # Filmgenre-Inszenierung, lange gehaltene Einstellungen, Push-in.
        "stilblock": (
            "Detailed flat vector illustration with REALISTIC human proportions "
            "and faces (not cartoon-round), crisp cel shading with bold shadow "
            "shapes, rich saturated set colours, dramatic movie lighting, "
            "film-noir and blockbuster staging, detailed interiors with props, "
            "composition like a movie still. Physical in-scene signage is "
            "allowed. Clearly illustrated, never photographic, no 3D render. "),
        "motion_stil": (
            " One slow deliberate camera move (push-in or lateral drift), "
            "characters hold their pose with micro movements: blinks, a head "
            "turn, one clear gesture. Long held cinematic shot. Keep the flat "
            "vector illustration style of the source image exactly."),
    },
}

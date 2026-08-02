#!/usr/bin/env python3
"""GEN_ART — die Bildwelt eines Projekts, pro Projekt frisch erzeugt.

Das ist der Teil, an dem der erste Motion-Graphics-Versuch gescheitert ist.
Gemessen gegen echte Filme: Kantendichte 196 statt 450-1066, 52 Farbtoene statt
106-124. Beides laesst sich mit gezeichneten Rechtecken nicht erreichen - es
fehlt schlicht die Grafik.

Grundsatz, unveraendert aus der Whiteboard-Pipeline: **niemals eine ganze Szene
generieren lassen.** Jedes Element kommt einzeln und freigestellt, damit der
Renderer es als eigene Ebene bewegen kann. Wer eine komplette Szene generieren
laesst, gibt die Kontrolle ueber Komposition, Timing und Wiederholbarkeit ab.

Was die Recherche fuer Stilkonsistenz ueber einen ganzen Satz hergibt und was
hier deshalb umgesetzt ist:

  * ein STILBLOCK, der wortgleich in jeden einzelnen Prompt kopiert wird
  * die PROJEKTPALETTE als Hexwerte im Prompt, nicht als Farbnamen
  * das erste erzeugte Bild dient als REFERENZBILD fuer alle weiteren -
    ein Referenzbild verankert nachweislich staerker als jeder Seed
  * generiert wird gegen einen MAGENTA-Hintergrund, der sich sauber
    ausschneiden laesst; flache Vektorgrafik hat harte Kanten, das
    funktioniert dort deutlich besser als bei fotorealistischem Material

Aufruf:
    export KIE_API_KEY=...
    python3 scripts/gen_art.py cases/<projekt>

Erwartet in cases/<projekt>/art.json:
    {"palette": {...}, "elemente": {"telefon": "a desk telephone, ringing", ...}}
"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kie

MODELL_NEU = "gpt-image-2-text-to-image"        # erstes Bild, der Stilanker
MODELL_REF = "gpt-image-2-image-to-image"       # alle weiteren, gegen den Anker
SCHLUESSEL_HINWEIS = (
    "\nKIE_API_KEY ist nicht gesetzt.\n"
    "  export KIE_API_KEY=<dein eigener Schluessel>\n"
    "Der Schluessel gehoert in die Umgebung, nie in dieses Repo.\n"
)

# Der Hintergrund, gegen den generiert wird. Ein Ton, der in flacher
# Illustration praktisch nie vorkommt, damit das Ausschneiden nichts frisst.
FREISTELL_BG = "#FF00FF"


def stilblock(palette):
    """Wortgleich in jedem Prompt. Das ist der Anker fuer die Konsistenz."""
    hexe = ", ".join(
        f"#{r:02X}{g:02X}{b:02X}" for r, g, b in
        [palette[k] for k in ("bg", "surface", "ink", "muted", "accent") if k in palette]
    )
    return (
        "FLAT VECTOR ILLUSTRATION for a modern 2D motion-graphics explainer video. "
        "Bold simple geometric shapes, solid flat fills with two or three tonal steps "
        "per object for depth, clean crisp edges, no outlines, no gradients, "
        "no drop shadows, no texture, no 3D rendering, no photorealism. "
        f"Use ONLY this colour palette: {hexe}. "
        "ONE single isolated object, centred, generous margin, nothing cropped. "
        "No text, no letters, no numbers, no logos, no UI labels anywhere in the image. "
        f"Plain flat {FREISTELL_BG} magenta background, nothing else."
    )


def freistellen(pfad):
    """Magenta raus, Alphakanal rein. Der Rand wird leicht eingezogen, sonst
    bleibt ein magentafarbener Saum an den Kanten stehen."""
    import numpy as np
    from PIL import Image
    im = Image.open(pfad).convert("RGB")
    a = np.array(im).astype(int)
    # Magenta: viel Rot, viel Blau, wenig Gruen
    magenta = (a[:, :, 0] > 150) & (a[:, :, 2] > 150) & (a[:, :, 1] < 110)
    alpha = np.where(magenta, 0, 255).astype(np.uint8)

    import cv2
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=1)
    ys, xs = np.where(alpha > 128)
    if len(xs) == 0:
        return False
    rgba = np.dstack([a.astype(np.uint8), alpha])
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(rgba, "RGBA").save(pfad)
    return True


def erzeuge(schluessel, beschreibung, stil, out_dir, referenz=None):
    ziel = os.path.join(out_dir, schluessel + ".png")
    if os.path.exists(ziel):
        return schluessel, "schon da", None
    inp = {"prompt": f"{stil} The object: {beschreibung}.", "aspect_ratio": "1:1"}
    modell = MODELL_NEU
    if referenz:
        # Das Referenzbild verankert Linienstaerke, Farbwahl und Formensprache
        # deutlich staerker als jeder Seed. Deshalb laeuft alles ausser dem
        # ersten Bild ueber die Bild-zu-Bild-Variante.
        inp["image_urls"] = [referenz]
        inp["prompt"] = (f"Keep the exact visual style, line weight, colour palette and "
                         f"shape language of the reference image. {inp['prompt']}")
        modell = MODELL_REF
    try:
        r = kie.run(modell, inp, out_path=ziel, timeout=600)
        if not freistellen(ziel):
            os.remove(ziel)
            return schluessel, "leer nach Freistellen - neu versuchen", None
        return schluessel, "erzeugt", (r.get("urls") or [None])[0]
    except Exception as e:
        return schluessel, f"FEHLER: {e}", None


def main(case):
    if not os.environ.get("KIE_API_KEY"):
        raise SystemExit(SCHLUESSEL_HINWEIS)
    cfg_p = os.path.join(case, "art.json")
    if not os.path.exists(cfg_p):
        raise SystemExit(
            f"\n{cfg_p} fehlt.\n"
            f'  {{"palette": {{"bg":[22,27,44], ...}},\n'
            f'   "elemente": {{"telefon": "a desk telephone, ringing"}}}}\n')
    cfg = json.load(open(cfg_p))
    out_dir = os.path.join(case, "art")
    os.makedirs(out_dir, exist_ok=True)
    stil = stilblock(cfg["palette"])
    elemente = list(cfg["elemente"].items())

    # Das erste Bild wird zuerst und allein erzeugt; es dient allen weiteren als
    # Referenz. Ohne diesen Anker driften Linienstaerke und Farbwahl ueber den
    # Satz hinweg auseinander - das ist der am besten belegte Konsistenzhebel.
    k0, b0 = elemente[0]
    print(f"  Anker: {k0}", flush=True)
    _, status, ref = erzeuge(k0, b0, stil, out_dir)
    print(f"    {k0}: {status}", flush=True)

    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(erzeuge, k, b, stil, out_dir, ref) for k, b in elemente[1:]]
        for f in as_completed(futs):
            k, status, _ = f.result()
            print(f"    {k}: {status}", flush=True)

    fehlend = [k for k, _ in elemente if not os.path.exists(os.path.join(out_dir, k + ".png"))]
    if fehlend:
        print(f"\n  FEHLT noch: {', '.join(fehlend)} - nochmal starten, "
              f"vorhandene werden uebersprungen.", flush=True)
        return 1
    print(f"\n  {len(elemente)} Grafiken in {out_dir}", flush=True)
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    sys.exit(main(os.path.abspath(sys.argv[1])))

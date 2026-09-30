#!/usr/bin/env python3
"""KI_PIPELINE — Erklärvideos im Keyframe→Video-Verfahren.

Der Ablauf pro Fall (aus dem funktionierenden Archiv-Verfahren destilliert,
plus die Lehren aus der Recherche):

  1. vo      EINE durchgehende Sprachaufnahme, Szenengrenzen an den Absätzen
             (scripts/mg_vo.py - eine Stimme, garantiert)
  2. kf      Keyframes: Szene 1 wird zuerst erzeugt und ist der STILANKER,
             alle weiteren laufen als Bild-zu-Bild gegen diesen Anker.
             >>> KEYFRAME-GATE: Bilder ansehen, BEVOR Videogeld fliesst. <<<
  3. clips   grok-imagine/image-to-video, Dauer = Sprechdauer + Puffer (6-12 s)
  4. final   Clips auf die Sprechdauern schneiden, zusammensetzen, Tonspur
             darunter, dezente Untertitel, KI-KENNZEICHNUNG (EU AI Act,
             Pflicht ab 02.08.2026 - deutsch, dauerhaft sichtbar).

Aufruf:
    export KIE_API_KEY=...
    python3 scripts/ki_pipeline.py cases/<fall> [vo|kf|clips|final|all]

Erwartet cases/<fall>/skript.json:
    {"stil": "aquarell",                 # Preset aus scripts/ki_stile.py
     "szenen": [{"vo": "...", "bild": "...", "motion": "..."}, ...]}
Stimme und Ton kommen aus dem Stil-Preset, koennen aber im skript.json
ueberschrieben werden.
"""
import json, math, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kie
import mg_vo
from ki_stile import STILE

KF_T2I = "gpt-image-2-text-to-image"
KF_I2I = "gpt-image-2-image-to-image"
VIDEO = "grok-imagine/image-to-video"
FPS = 30


def lade(fall):
    cfg = json.load(open(os.path.join(fall, "skript.json")))
    stil = STILE[cfg["stil"]]
    cfg.setdefault("stimme", stil["stimme"])
    cfg.setdefault("ton", stil["ton"])
    return cfg, stil


def state_pfad(fall):
    return os.path.join(fall, "state.json")


def state_laden(fall):
    p = state_pfad(fall)
    return json.load(open(p)) if os.path.exists(p) else {"szenen": {}}


def state_sichern(fall, st):
    json.dump(st, open(state_pfad(fall), "w"), indent=1)


def retry(fn, n=3):
    for i in range(n):
        try:
            return fn()
        except Exception as e:
            print(f"    Versuch {i + 1}: {str(e)[:90]}", flush=True)
    raise RuntimeError("dreimal fehlgeschlagen")



def schnitte(cfg, beats=None):
    """Jede Szene = 1, 2 oder 3 Einstellungen (bild2/bild3). Splits: 55/45
    bzw. 40/30/30 - mehr Schnitte, gleiche Tonspur."""
    out = []
    for i, s in enumerate(cfg["szenen"]):
        beat = beats[i] if beats else None
        teile = [(s["bild"], s["motion"])]
        if s.get("bild2"): teile.append((s["bild2"], s["motion2"]))
        if s.get("bild3"): teile.append((s["bild3"], s["motion3"]))
        anteile = {1: [1.0], 2: [0.55, 0.45], 3: [0.40, 0.30, 0.30]}[len(teile)]
        for k, ((b, m), a) in enumerate(zip(teile, anteile)):
            sid = f"{i+1:02d}" + ("" if len(teile) == 1 else "abc"[k])
            out.append({"id": sid, "bild": b, "motion": m,
                        "dauer": round(beat * a, 2) if beat else None})
    return out


# ------------------------------------------------------------------ Phasen --
def phase_vo(fall, cfg, stil):
    # mg_vo erwartet "zeilen"
    if "zeilen" not in cfg:
        tmp = dict(cfg)
        tmp["zeilen"] = [s["vo"] for s in cfg["szenen"]]
        json.dump(tmp, open(os.path.join(fall, "skript.json"), "w"),
                  ensure_ascii=False, indent=1)
    mg_vo.main(fall)


def phase_kf(fall, cfg, stil):
    st = state_laden(fall)
    kf_dir = os.path.join(fall, "keyframes")
    os.makedirs(kf_dir, exist_ok=True)
    zusatz = " 16:9 wide composition. No text, no words, no letters, no watermark."
    liste = schnitte(cfg)

    s0 = liste[0]
    rec0 = st["szenen"].setdefault(s0["id"], {})
    p0 = os.path.join(kf_dir, s0["id"] + ".png")
    if not (os.path.exists(p0) and rec0.get("kf_url")):
        inp = {"prompt": stil["stilblock"] + s0["bild"] + zusatz, "aspect_ratio": "16:9"}
        r = retry(lambda: kie.run(KF_T2I, inp, p0, timeout=600))
        rec0["kf_url"] = r["urls"][0]; rec0["kf_credits"] = r.get("credits")
        state_sichern(fall, st)
    print("  kf " + s0["id"] + " (Anker) ok", flush=True)
    anker = rec0["kf_url"]

    def eine(sc):
        rec = st["szenen"].setdefault(sc["id"], {})
        p = os.path.join(kf_dir, sc["id"] + ".png")
        if os.path.exists(p) and rec.get("kf_url"):
            return f"kf {sc['id']} vorhanden"
        inp = {"prompt": ("Keep the exact same visual style, palette, rendering "
                          "technique AND the same recurring characters as the "
                          "reference image. New scene: "
                          + stil["stilblock"] + sc["bild"] + zusatz),
               "image_urls": [anker], "aspect_ratio": "16:9"}
        r = retry(lambda: kie.run(KF_I2I, inp, p, timeout=600))
        rec["kf_url"] = r["urls"][0]; rec["kf_credits"] = r.get("credits")
        return f"kf {sc['id']} ok"

    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = [ex.submit(eine, sc) for sc in liste[1:]]
        for f in as_completed(futs):
            print("  " + f.result(), flush=True)
            state_sichern(fall, st)


def phase_clips(fall, cfg, stil):
    st = state_laden(fall)
    beats = json.load(open(os.path.join(fall, "audio", "beats.json")))["dauern"]
    clip_dir = os.path.join(fall, "clips")
    os.makedirs(clip_dir, exist_ok=True)
    liste = schnitte(cfg, beats)

    def einer(sc):
        rec = st["szenen"].setdefault(sc["id"], {})
        p = os.path.join(clip_dir, sc["id"] + ".mp4")
        if os.path.exists(p):
            return f"clip {sc['id']} vorhanden"
        if not rec.get("kf_url"):
            return f"clip {sc['id']} UEBERSPRUNGEN - kein Keyframe"
        d = max(6, min(12, math.ceil(sc["dauer"] + 0.8)))
        inp = {"image_urls": [rec["kf_url"]],
               "prompt": sc["motion"] + stil["motion_stil"] + " No text anywhere.",
               "mode": "normal", "duration": str(d), "resolution": "720p",
               "aspect_ratio": "16:9", "nsfw_checker": False}
        r = retry(lambda: kie.run(VIDEO, inp, p, timeout=1200))
        rec["clip_credits"] = r.get("credits"); rec["clip_dur"] = d
        return f"clip {sc['id']} ok ({d}s)"

    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = [ex.submit(einer, sc) for sc in liste]
        for f in as_completed(futs):
            print("  " + f.result(), flush=True)
            state_sichern(fall, st)


def saetze_verteilen(vo, n):
    """Absatz in n Teile fuer n Einstellungen - an Satzgrenzen, sonst ganz."""
    import re
    if n <= 1:
        return [vo]
    teile = [t.strip() for t in re.split(r"(?<=[.!?:]) +", vo) if t.strip()]
    if len(teile) < n:
        return [vo] * n          # zu wenige Saetze: ueberall der ganze Text
    # Saetze moeglichst gleichmaessig auf n Gruppen verteilen
    gruppen = [[] for _ in range(n)]
    ziel = len(teile) / n
    for i, t in enumerate(teile):
        gruppen[min(int(i / ziel), n - 1)].append(t)
    return [" ".join(g) if g else vo for g in gruppen]


def untertitel_pngs(fall, cfg, beats, seg_dir):
    """Untertitel je Einstellung (satzgenau) + optionale KI-Kennzeichnung."""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype(next(p for p in ["/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if os.path.exists(p)), 30)
    font_k = ImageFont.truetype(next(p for p in ["/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if os.path.exists(p)), 17)
    pfade = []
    liste = schnitte(cfg, beats)
    je_szene = {}
    for sc in liste:
        je_szene.setdefault(sc["id"][:2], []).append(sc)
    texte = {}
    for sid, scs in je_szene.items():
        vo = cfg["szenen"][int(sid) - 1]["vo"]
        for sc, txt in zip(scs, saetze_verteilen(vo, len(scs))):
            texte[sc["id"]] = txt

    for sc in liste:
        img = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        text = texte[sc["id"]]
        zeilen = [text]
        if len(text) > 62:
            mitte = text.rfind(" ", 0, len(text) // 2 + 12)
            zeilen = [text[:mitte], text[mitte + 1:]]
        y = 720 - 34 - len(zeilen) * 38
        for z in zeilen:
            b = d.textbbox((0, 0), z, font=font)
            x = (1280 - (b[2] - b[0])) / 2
            d.text((x, y), z, font=font, fill=(255, 255, 255, 215),
                   stroke_width=2, stroke_fill=(20, 24, 36, 175))
            y += 38
        if cfg.get("kennzeichnung"):
            kt = "KI-generiertes Video"
            kb = d.textbbox((0, 0), kt, font=font_k)
            kx = 1280 - 20 - (kb[2] - kb[0])
            d.text((kx, 14), kt, font=font_k, fill=(255, 255, 255, 165),
                   stroke_width=1, stroke_fill=(20, 24, 36, 150))
        p = os.path.join(seg_dir, f"ov{sc['id']}.png")
        img.save(p)
        pfade.append((p, sc["dauer"]))
    return pfade


def phase_final(fall, cfg, stil):
    beats = json.load(open(os.path.join(fall, "audio", "beats.json")))["dauern"]
    final_dir = os.path.join(fall, "final")
    seg_dir = os.path.join(final_dir, "_seg")
    os.makedirs(seg_dir, exist_ok=True)

    liste = os.path.join(seg_dir, "liste.txt")
    with open(liste, "w") as f:
        for sc in schnitte(cfg, beats):
            clip = os.path.join(fall, "clips", sc["id"] + ".mp4")
            seg = os.path.join(seg_dir, sc["id"] + ".mp4")
            if not os.path.exists(seg):
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip,
                    "-vf", ("scale=1280:720:force_original_aspect_ratio=increase,"
                            "crop=1280:720,tpad=stop_mode=clone:stop_duration=15,"
                            f"fps={FPS}"),
                    "-t", f"{sc['dauer']:.2f}", "-an",
                    "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", seg],
                    check=True)
            f.write(f"file '{os.path.abspath(seg)}'\n")

    overlays = untertitel_pngs(fall, cfg, beats, seg_dir)

    roh = os.path.join(seg_dir, "koerper.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat",
                    "-safe", "0", "-i", liste, "-c", "copy", roh], check=True)

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", roh,
           "-i", os.path.join(fall, "audio", "full.wav")]
    for p, _ in overlays:
        cmd += ["-i", p]
    kette = []
    t = 0.0
    quelle = "[0:v]"
    for i, (_, dauer) in enumerate(overlays):
        ziel_lbl = f"[v{i}]"
        kette.append(f"{quelle}[{i + 2}:v]overlay=0:0:enable='between(t,{t:.2f},{t + dauer:.2f})'{ziel_lbl}")
        quelle = ziel_lbl
        t += dauer
    fg = ";".join(kette)
    name = os.path.basename(fall.rstrip("/"))
    ziel = os.path.join(final_dir, name + ".mp4")
    cmd += ["-filter_complex", fg, "-map", quelle, "-map", "1:a",
            "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", ziel]
    subprocess.run(cmd, check=True)
    # jede fertige Fassung landet automatisch im Sammelordner
    sammel = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "finale_videos", f"{cfg['stil']}_{name}.mp4")
    os.makedirs(os.path.dirname(sammel), exist_ok=True)
    import shutil
    shutil.copy(ziel, sammel)
    print(f"  FERTIG: {ziel}  (+ finale_videos/)", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    fall = os.path.abspath(sys.argv[1])
    was = sys.argv[2] if len(sys.argv) > 2 else "all"
    cfg, stil = lade(fall)
    if was in ("vo", "all"):    print("== VO ==", flush=True);    phase_vo(fall, cfg, stil)
    if was in ("kf", "all"):    print("== KEYFRAMES ==", flush=True); phase_kf(fall, cfg, stil)
    if was in ("clips", "all"): print("== CLIPS ==", flush=True);  phase_clips(fall, cfg, stil)
    if was in ("final", "all"): print("== FINAL ==", flush=True);  phase_final(fall, cfg, stil)
#!/usr/bin/env python3
"""KI_PIPELINE — Erklärvideos im Keyframe→Video-Verfahren.

Der Ablauf pro Fall (aus dem funktionierenden Archiv-Verfahren destilliert,
plus die Lehren aus der Recherche):

  1. vo      EINE durchgehende Sprachaufnahme, Szenengrenzen an den Absätzen
             (scripts/mg_vo.py - eine Stimme, garantiert)
  2. kf      Keyframes: Szene 1 wird zuerst erzeugt und ist der STILANKER,
             alle weiteren laufen als Bild-zu-Bild gegen diesen Anker.
             >>> KEYFRAME-GATE: Bilder ansehen, BEVOR Videogeld fliesst. <<<
  3. clips   grok-imagine/image-to-video, Dauer = Sprechdauer + Puffer (6-12 s)
  4. final   Clips auf die Sprechdauern schneiden, zusammensetzen, Tonspur
             darunter, dezente Untertitel, KI-KENNZEICHNUNG (EU AI Act,
             Pflicht ab 02.08.2026 - deutsch, dauerhaft sichtbar).

Aufruf:
    export KIE_API_KEY=...
    python3 scripts/ki_pipeline.py cases/<fall> [vo|kf|clips|final|all]

Erwartet cases/<fall>/skript.json:
    {"stil": "aquarell",                 # Preset aus scripts/ki_stile.py
     "szenen": [{"vo": "...", "bild": "...", "motion": "..."}, ...]}
Stimme und Ton kommen aus dem Stil-Preset, koennen aber im skript.json
ueberschrieben werden.
"""
import json, math, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kie
import mg_vo
from ki_stile import STILE

KF_T2I = "gpt-image-2-text-to-image"
KF_I2I = "gpt-image-2-image-to-image"
VIDEO = "grok-imagine/image-to-video"
FPS = 30


def lade(fall):
    cfg = json.load(open(os.path.join(fall, "skript.json")))
    stil = STILE[cfg["stil"]]
    cfg.setdefault("stimme", stil["stimme"])
    cfg.setdefault("ton", stil["ton"])
    return cfg, stil


def state_pfad(fall):
    return os.path.join(fall, "state.json")


def state_laden(fall):
    p = state_pfad(fall)
    return json.load(open(p)) if os.path.exists(p) else {"szenen": {}}


def state_sichern(fall, st):
    json.dump(st, open(state_pfad(fall), "w"), indent=1)


def retry(fn, n=3):
    for i in range(n):
        try:
            return fn()
        except Exception as e:
            print(f"    Versuch {i + 1}: {str(e)[:90]}", flush=True)
    raise RuntimeError("dreimal fehlgeschlagen")



def schnitte(cfg, beats=None):
    """Jede Szene = 1, 2 oder 3 Einstellungen (bild2/bild3). Splits: 55/45
    bzw. 40/30/30 - mehr Schnitte, gleiche Tonspur."""
    out = []
    for i, s in enumerate(cfg["szenen"]):
        beat = beats[i] if beats else None
        teile = [(s["bild"], s["motion"])]
        if s.get("bild2"): teile.append((s["bild2"], s["motion2"]))
        if s.get("bild3"): teile.append((s["bild3"], s["motion3"]))
        anteile = {1: [1.0], 2: [0.55, 0.45], 3: [0.40, 0.30, 0.30]}[len(teile)]
        for k, ((b, m), a) in enumerate(zip(teile, anteile)):
            sid = f"{i+1:02d}" + ("" if len(teile) == 1 else "abc"[k])
            out.append({"id": sid, "bild": b, "motion": m,
                        "dauer": round(beat * a, 2) if beat else None})
    return out


# ------------------------------------------------------------------ Phasen --
def phase_vo(fall, cfg, stil):
    # mg_vo erwartet "zeilen"
    if "zeilen" not in cfg:
        tmp = dict(cfg)
        tmp["zeilen"] = [s["vo"] for s in cfg["szenen"]]
        json.dump(tmp, open(os.path.join(fall, "skript.json"), "w"),
                  ensure_ascii=False, indent=1)
    mg_vo.main(fall)


def phase_kf(fall, cfg, stil):
    st = state_laden(fall)
    kf_dir = os.path.join(fall, "keyframes")
    os.makedirs(kf_dir, exist_ok=True)
    zusatz = " 16:9 wide composition. No text, no words, no letters, no watermark."
    liste = schnitte(cfg)

    s0 = liste[0]
    rec0 = st["szenen"].setdefault(s0["id"], {})
    p0 = os.path.join(kf_dir, s0["id"] + ".png")
    if not (os.path.exists(p0) and rec0.get("kf_url")):
        inp = {"prompt": stil["stilblock"] + s0["bild"] + zusatz, "aspect_ratio": "16:9"}
        r = retry(lambda: kie.run(KF_T2I, inp, p0, timeout=600))
        rec0["kf_url"] = r["urls"][0]; rec0["kf_credits"] = r.get("credits")
        state_sichern(fall, st)
    print("  kf " + s0["id"] + " (Anker) ok", flush=True)
    anker = rec0["kf_url"]

    def eine(sc):
        rec = st["szenen"].setdefault(sc["id"], {})
        p = os.path.join(kf_dir, sc["id"] + ".png")
        if os.path.exists(p) and rec.get("kf_url"):
            return f"kf {sc['id']} vorhanden"
        inp = {"prompt": ("Keep the exact same visual style, palette, rendering "
                          "technique AND the same recurring characters as the "
                          "reference image. New scene: "
                          + stil["stilblock"] + sc["bild"] + zusatz),
               "image_urls": [anker], "aspect_ratio": "16:9"}
        r = retry(lambda: kie.run(KF_I2I, inp, p, timeout=600))
        rec["kf_url"] = r["urls"][0]; rec["kf_credits"] = r.get("credits")
        return f"kf {sc['id']} ok"

    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = [ex.submit(eine, sc) for sc in liste[1:]]
        for f in as_completed(futs):
            print("  " + f.result(), flush=True)
            state_sichern(fall, st)


def phase_clips(fall, cfg, stil):
    st = state_laden(fall)
    beats = json.load(open(os.path.join(fall, "audio", "beats.json")))["dauern"]
    clip_dir = os.path.join(fall, "clips")
    os.makedirs(clip_dir, exist_ok=True)
    liste = schnitte(cfg, beats)

    def einer(sc):
        rec = st["szenen"].setdefault(sc["id"], {})
        p = os.path.join(clip_dir, sc["id"] + ".mp4")
        if os.path.exists(p):
            return f"clip {sc['id']} vorhanden"
        if not rec.get("kf_url"):
            return f"clip {sc['id']} UEBERSPRUNGEN - kein Keyframe"
        d = max(6, min(12, math.ceil(sc["dauer"] + 0.8)))
        inp = {"image_urls": [rec["kf_url"]],
               "prompt": sc["motion"] + stil["motion_stil"] + " No text anywhere.",
               "mode": "normal", "duration": str(d), "resolution": "720p",
               "aspect_ratio": "16:9", "nsfw_checker": False}
        r = retry(lambda: kie.run(VIDEO, inp, p, timeout=1200))
        rec["clip_credits"] = r.get("credits"); rec["clip_dur"] = d
        return f"clip {sc['id']} ok ({d}s)"

    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = [ex.submit(einer, sc) for sc in liste]
        for f in as_completed(futs):
            print("  " + f.result(), flush=True)
            state_sichern(fall, st)


def saetze_verteilen(vo, n):
    """Absatz in n Teile fuer n Einstellungen - an Satzgrenzen, sonst ganz."""
    import re
    if n <= 1:
        return [vo]
    teile = [t.strip() for t in re.split(r"(?<=[.!?:]) +", vo) if t.strip()]
    if len(teile) < n:
        return [vo] * n          # zu wenige Saetze: ueberall der ganze Text
    # Saetze moeglichst gleichmaessig auf n Gruppen verteilen
    gruppen = [[] for _ in range(n)]
    ziel = len(teile) / n
    for i, t in enumerate(teile):
        gruppen[min(int(i / ziel), n - 1)].append(t)
    return [" ".join(g) if g else vo for g in gruppen]


def untertitel_pngs(fall, cfg, beats, seg_dir):
    """Untertitel je Einstellung (satzgenau) + optionale KI-Kennzeichnung."""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    font_k = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 17)
    pfade = []
    liste = schnitte(cfg, beats)
    je_szene = {}
    for sc in liste:
        je_szene.setdefault(sc["id"][:2], []).append(sc)
    texte = {}
    for sid, scs in je_szene.items():
        vo = cfg["szenen"][int(sid) - 1]["vo"]
        for sc, txt in zip(scs, saetze_verteilen(vo, len(scs))):
            texte[sc["id"]] = txt

    for sc in liste:
        img = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        text = texte[sc["id"]]
        zeilen = [text]
        if len(text) > 62:
            mitte = text.rfind(" ", 0, len(text) // 2 + 12)
            zeilen = [text[:mitte], text[mitte + 1:]]
        y = 720 - 34 - len(zeilen) * 38
        for z in zeilen:
            b = d.textbbox((0, 0), z, font=font)
            x = (1280 - (b[2] - b[0])) / 2
            d.text((x, y), z, font=font, fill=(255, 255, 255, 215),
                   stroke_width=2, stroke_fill=(20, 24, 36, 175))
            y += 38
        if cfg.get("kennzeichnung"):
            kt = "KI-generiertes Video"
            kb = d.textbbox((0, 0), kt, font=font_k)
            kx = 1280 - 20 - (kb[2] - kb[0])
            d.text((kx, 14), kt, font=font_k, fill=(255, 255, 255, 165),
                   stroke_width=1, stroke_fill=(20, 24, 36, 150))
        p = os.path.join(seg_dir, f"ov{sc['id']}.png")
        img.save(p)
        pfade.append((p, sc["dauer"]))
    return pfade


def phase_final(fall, cfg, stil):
    beats = json.load(open(os.path.join(fall, "audio", "beats.json")))["dauern"]
    final_dir = os.path.join(fall, "final")
    seg_dir = os.path.join(final_dir, "_seg")
    os.makedirs(seg_dir, exist_ok=True)

    liste = os.path.join(seg_dir, "liste.txt")
    with open(liste, "w") as f:
        for sc in schnitte(cfg, beats):
            clip = os.path.join(fall, "clips", sc["id"] + ".mp4")
            seg = os.path.join(seg_dir, sc["id"] + ".mp4")
            if not os.path.exists(seg):
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip,
                    "-vf", ("scale=1280:720:force_original_aspect_ratio=increase,"
                            "crop=1280:720,tpad=stop_mode=clone:stop_duration=15,"
                            f"fps={FPS}"),
                    "-t", f"{sc['dauer']:.2f}", "-an",
                    "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", seg],
                    check=True)
            f.write(f"file '{os.path.abspath(seg)}'\n")

    overlays = untertitel_pngs(fall, cfg, beats, seg_dir)

    roh = os.path.join(seg_dir, "koerper.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat",
                    "-safe", "0", "-i", liste, "-c", "copy", roh], check=True)

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", roh,
           "-i", os.path.join(fall, "audio", "full.wav")]
    for p, _ in overlays:
        cmd += ["-i", p]
    kette = []
    t = 0.0
    quelle = "[0:v]"
    for i, (_, dauer) in enumerate(overlays):
        ziel_lbl = f"[v{i}]"
        kette.append(f"{quelle}[{i + 2}:v]overlay=0:0:enable='between(t,{t:.2f},{t + dauer:.2f})'{ziel_lbl}")
        quelle = ziel_lbl
        t += dauer
    fg = ";".join(kette)
    name = os.path.basename(fall.rstrip("/"))
    ziel = os.path.join(final_dir, name + ".mp4")
    cmd += ["-filter_complex", fg, "-map", quelle, "-map", "1:a",
            "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", ziel]
    subprocess.run(cmd, check=True)
    # jede fertige Fassung landet automatisch im Sammelordner
    sammel = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "finale_videos", f"{cfg['stil']}_{name}.mp4")
    os.makedirs(os.path.dirname(sammel), exist_ok=True)
    import shutil
    shutil.copy(ziel, sammel)
    print(f"  FERTIG: {ziel}  (+ finale_videos/)", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    fall = os.path.abspath(sys.argv[1])
    was = sys.argv[2] if len(sys.argv) > 2 else "all"
    cfg, stil = lade(fall)
    if was in ("vo", "all"):    print("== VO ==", flush=True);    phase_vo(fall, cfg, stil)
    if was in ("kf", "all"):    print("== KEYFRAMES ==", flush=True); phase_kf(fall, cfg, stil)
    if was in ("clips", "all"): print("== CLIPS ==", flush=True);  phase_clips(fall, cfg, stil)
    if was in ("final", "all"): print("== FINAL ==", flush=True);  phase_final(fall, cfg, stil)

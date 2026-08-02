#!/usr/bin/env python3
"""MG_VO — die Sprecherstimme fuer ein Motion-Design-Video, als EINE Aufnahme.

Warum eine Aufnahme: Neun einzelne TTS-Aufrufe ergaben messbar neun
verschiedene Stimmlagen (Grundfrequenz 100-167 Hz zwischen den Szenen).
Eine durchgehende Aufnahme hat eine Stimme - garantiert. Die Szenengrenzen
werden danach an den Sprechpausen gefunden und den Absaetzen zugeordnet.

Zwei Fallen, beide schon bezahlt:
  * Mehrere dialogue_turns schneidet gemini-2-5-pro-tts ab (nur ~9 s kamen an).
    Deshalb: EIN Text, Absaetze durch Leerzeilen getrennt.
  * "Die 8 laengsten Pausen" als Grenzen ist falsch - Satzpausen koennen laenger
    sein als Absatzpausen. Richtig: erwartete Grenze aus dem kumulierten
    Textanteil schaetzen (Zahlwoerter doppelt gewichtet, weil gesprochen viel
    laenger) und die naechstliegende Pause waehlen.

Aufruf:
    export KIE_API_KEY=...
    python3 scripts/mg_vo.py cases/<fall>

Erwartet cases/<fall>/skript.json:
    {"stimme": "Charon",
     "ton": "Ruhiger, sachlicher deutscher Erzaehler...",
     "zeilen": ["Satz eins...", "Satz zwei...", ...]}

Erzeugt: cases/<fall>/audio/full.wav, cases/<fall>/audio/beats.json
und kopiert die Aufnahme nach mograph/public/vo/<fallname>.wav.
"""
import json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kie

MODELL = "google/gemini-2-5-pro-tts"


def dauer_von(pfad):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", pfad]).decode().strip())


def gewicht(zeile):
    """Textanteil als Zeitschaetzer. Zahlwoerter sprechen sich viel laenger,
    als sie geschrieben sind."""
    w = len(zeile)
    for zahlwort in re.findall(r"[a-zäöüß]*(?:tausend|hundert|zig|zehn)[a-zäöüß]*",
                               zeile.lower()):
        w += len(zahlwort)
    return w


def pausen_finden(wav, gesamt, noise=-36, mindest=0.3):
    out = subprocess.run(
        ["ffmpeg", "-i", wav, "-af", f"silencedetect=noise={noise}dB:d={mindest}",
         "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(m) for m in re.findall(r"silence_start: ([0-9.]+)", out)]
    enden = [float(m) for m in re.findall(r"silence_end: ([0-9.]+)", out)]
    return [((s + e) / 2, e - s) for s, e in zip(starts, enden)
            if s > 0.4 and e < gesamt - 0.4]


def main(fall):
    cfg = json.load(open(os.path.join(fall, "skript.json")))
    zeilen = cfg["zeilen"]
    audio_dir = os.path.join(fall, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    wav = os.path.join(audio_dir, "full.wav")

    if not os.path.exists(wav):
        if not os.environ.get("KIE_API_KEY"):
            raise SystemExit("KIE_API_KEY ist nicht gesetzt (export KIE_API_KEY=...).")
        inp = {"speakers": [{"speaker_id": "Speaker 1", "voice_name": cfg.get("stimme", "Charon")}],
               "dialogue_turns": [{"speaker_id": "Speaker 1", "text": "\n\n".join(zeilen)}],
               "sample_context": cfg.get("ton", "Ruhiger, sachlicher deutscher Erzähler."),
               "temperature": 1}
        for versuch in range(3):
            try:
                kie.run(MODELL, inp, wav, timeout=900)
                break
            except Exception as e:
                print(f"  Versuch {versuch + 1} fehlgeschlagen: {str(e)[:90]}")
        else:
            raise SystemExit("TTS dreimal fehlgeschlagen.")

    gesamt = dauer_von(wav)
    erwartete_mindestlaenge = sum(len(z) for z in zeilen) / 22.0   # ~ grobe Untergrenze
    if gesamt < erwartete_mindestlaenge:
        raise SystemExit(f"Aufnahme nur {gesamt:.1f}s - vermutlich abgeschnitten. "
                         f"full.wav loeschen und neu starten.")
    print(f"  Aufnahme: {gesamt:.2f}s")

    kandidaten = []
    for noise, mind in [(-36, 0.30), (-34, 0.24), (-30, 0.20), (-27, 0.16)]:
        kandidaten = pausen_finden(wav, gesamt, noise, mind)
        if len(kandidaten) >= len(zeilen) - 1:
            break
    if len(kandidaten) < len(zeilen) - 1:
        raise SystemExit("Zu wenige Sprechpausen erkennbar.")

    gw = [gewicht(z) for z in zeilen]
    summe = sum(gw)
    grenzen, benutzt = [], set()
    kum = 0
    for g in gw[:-1]:
        kum += g
        ziel = kum / summe * gesamt
        for mitte, laenge in sorted(kandidaten,
                                    key=lambda pz: abs(pz[0] - ziel) - min(pz[1], 0.6) * 1.5):
            if mitte not in benutzt and (not grenzen or mitte > grenzen[-1] + 0.8):
                grenzen.append(mitte)
                benutzt.add(mitte)
                break
    grenzen.sort()
    if len(grenzen) != len(zeilen) - 1:
        raise SystemExit("Pausenzuordnung fehlgeschlagen.")

    starts = [0.0] + grenzen
    dauern = [round(b - a, 2) for a, b in zip(starts, grenzen)]
    dauern.append(round(gesamt - grenzen[-1] + 1.0, 2))   # +1 s Halten am Ende

    for i, (d, z) in enumerate(zip(dauern, zeilen)):
        print(f"  {i + 1:02d}  {d:5.2f}s  {z[:64]}")
    json.dump({"dauern": dauern}, open(os.path.join(audio_dir, "beats.json"), "w"))

    # in den Remotion-Ordner kopieren, unter dem Fallnamen
    name = os.path.basename(fall.rstrip("/")).replace("_mg", "")
    ziel = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        "mograph", "public", "vo", f"{name}.wav")
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    shutil.copy(wav, ziel)
    print(f"\n  beats.json geschrieben, Audio -> mograph/public/vo/{name}.wav")
    print(f"  BEATS fuer tokens.ts: {dauern}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(os.path.abspath(sys.argv[1]))

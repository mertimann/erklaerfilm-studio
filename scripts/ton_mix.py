#!/usr/bin/env python3
"""TON_MIX — Musik und Soundeffekte unter die fertige Tonspur legen.

Die Recherche war deutlich: Profis schneiden nach Emotion, Story, Rhythmus,
SOUND, Action - und genau der Sound fehlte bisher komplett. Hier kommt er:
Musikbetten mit Ein-/Ausblendung, ein bewusster Musik-Stopp als Gag-Timing,
und punktgenaue Effekte auf den Schnitten.

Erwartet cases/<fall>/ton.json:
    {"spuren": [
        {"datei": "musik/warm.mp3", "von": 0.0, "bis": 3.57,
         "offset": 0.0, "gain_db": -14, "fade_in": 0.0, "fade_out": 0.25},
        {"datei": "sfx/stempel.wav", "von": 23.36, "gain_db": -4}
    ]}
`von`/`bis` in Video-Sekunden, `offset` = Startpunkt in der Quelldatei.
Ohne `bis` laeuft die Datei in voller Laenge ab `von`.

Aufruf: python3 scripts/ton_mix.py cases/<fall>
Nimmt final/<fall>.mp4, schreibt final/<fall>_ton.mp4.
"""
import json, os, subprocess, sys


def main(fall):
    name = os.path.basename(fall.rstrip("/"))
    video = os.path.join(fall, "final", f"{name}.mp4")
    ziel = os.path.join(fall, "final", f"{name}_ton.mp4")
    plan = json.load(open(os.path.join(fall, "ton.json")))
    spuren = plan["spuren"]

    videolaenge = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", video]).decode().strip())

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", video]
    for sp in spuren:
        cmd += ["-i", os.path.join(fall, sp["datei"])]

    ketten = []
    labels = []
    for i, sp in enumerate(spuren):
        von = float(sp["von"])
        bis = float(sp.get("bis", 0)) or None
        offset = float(sp.get("offset", 0))
        gain = float(sp.get("gain_db", 0))
        fin = float(sp.get("fade_in", 0))
        fout = float(sp.get("fade_out", 0))
        dauer = (bis - von) if bis else None

        f = f"[{i + 1}:a]atrim=start={offset}"
        if dauer:
            f += f":end={offset + dauer}"
        f += ",asetpts=PTS-STARTPTS"
        if fin > 0:
            f += f",afade=t=in:st=0:d={fin}"
        if fout > 0 and dauer:
            f += f",afade=t=out:st={max(0, dauer - fout)}:d={fout}"
        f += f",volume={gain}dB"
        if von > 0:
            ms = int(von * 1000)
            f += f",adelay={ms}|{ms}"
        f += f",apad=whole_dur={videolaenge}[m{i}]"
        ketten.append(f)
        labels.append(f"[m{i}]")

    mix = "".join(["[0:a]"] + labels) + \
          f"amix=inputs={len(labels) + 1}:normalize=0:duration=first[aus]"
    ketten.append(mix)

    cmd += ["-filter_complex", ";".join(ketten),
            "-map", "0:v", "-map", "[aus]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", ziel]
    subprocess.run(cmd, check=True)
    print(f"  Tonmischung: {ziel}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(os.path.abspath(sys.argv[1]))

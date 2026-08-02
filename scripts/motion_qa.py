#!/usr/bin/env python3
"""MOTION_QA — "sieht aus wie PowerPoint" als messbarer Test.

Der Vorwurf war berechtigt und er ist nicht Geschmackssache. Ich habe echte
Motion-Graphics-Filme Frame fuer Frame vermessen und dagegen unser Ergebnis:

                         Referenzen       erster eigener Versuch
    eingefrorene Frames  2-13 %           54,6 %
    bewegte Flaeche      0,6-5,1 %        0,1 %
    Kantendichte         497-1066         212
    Farbtoene/Bild       106-124          47

Gemessen an: einem Kurzgesagt-artigen Erklaerfilm, einem flachen 2D-Explainer
und einem CGI-Film (BUCK). Die Schwellen unten sind bewusst unter dem
schwaechsten Referenzwert angesetzt - sie fangen "Standbild mit Einflug", nicht
"etwas weniger dicht als das beste Studio der Welt".

Die vier Zahlen messen vier verschiedene Fehler:

    STANDBILD-ANTEIL  Elemente kommen rein und frieren ein. Das ist der
                      PowerPoint-Fehler. Echte Filme halten alles in leichter
                      Dauerbewegung.
    BEWEGTE FLAECHE   wie viel sich pro Frame ueberhaupt tut.
    KANTENDICHTE      wie viel im Bild ist. Drei Primitive auf einer Flaeche
                      ergeben ein Diagramm, keine Bildwelt.
    FARBTOENE         flach heisst nicht einfarbig. Echte flache Grafik
                      schattiert und tint-et ihre eigenen Toene.

Aufruf:  python3 scripts/motion_qa.py <video.mp4> [weitere.mp4 ...]
"""
import sys, os
import cv2
import numpy as np

# Ab wann gilt ein Frame als Standbild?
#
# Die erste Fassung nahm 1,5 % geaenderte Pixel - das war falsch. Eine
# Kontrollprobe (ein grosser Kreis wandert quer durchs Bild) wurde damit als
# "100 % Standbild" gewertet, obwohl sich offensichtlich etwas bewegt. Die
# Schwelle mass nicht Bewegung, sondern Schnitte.
#
# Neu kalibriert. Anteil der Frames unterhalb der jeweiligen Schwelle:
#
#                    <0,05 %  <0,1 %  <0,2 %  <0,5 %
#   Kurzgesagt          2,2 %   4,1 %  10,7 %  30,1 %
#   flach 2D            5,9 %   6,5 %   7,6 %  12,7 %
#   CGI                12,9 %  13,5 %  14,1 %  15,7 %
#   Kontrolle Kreis     0,0 %   0,0 %   0,0 %   0,0 %
#
# Bei 0,05 % trennt es sauber: Referenzen 2-13 %, und die Kontrollprobe faellt
# korrekt auf 0. Das ist die Schwelle fuer "es ist eingefroren".
STANDBILD_SCHWELLE = 0.0005

GRENZEN = {
    "standbild_max":   0.25,   # Referenzen: 0,022 / 0,059 / 0,129
    "bewegung_min":    0.005,  # Referenzen: 0,006 / 0,010 / 0,022 / 0,051
    "kanten_min":      450.0,  # Referenzen: 497 / 865 / 1066
    "farbtoene_min":   100,    # Referenzen: 106 / 117 / 124
}


def messen(pfad, max_sekunden=120):
    cap = cv2.VideoCapture(pfad)
    if not cap.isOpened():
        raise SystemExit(f"Kann '{pfad}' nicht oeffnen.")
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    grenze = int(max_sekunden * fps)

    vor = None
    bewegt = []          # Anteil geaenderter Pixel je Frame
    kanten, toene = [], []
    n = 0
    # jede halbe Sekunde ein Frame fuer die Dichtemasse - das reicht und
    # haelt die Laufzeit im Rahmen
    dichte_takt = max(1, int(fps / 2))

    while n < grenze:
        ok, frame = cap.read()
        if not ok:
            break
        klein = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (240, 135))
        if vor is not None:
            d = np.abs(klein.astype(np.int16) - vor.astype(np.int16))
            bewegt.append(float((d > 8).mean()))
        vor = klein

        if n % dichte_takt == 0:
            gross = cv2.resize(frame, (640, 360))
            g = cv2.cvtColor(gross, cv2.COLOR_BGR2GRAY)
            kanten.append(float(cv2.Canny(g, 40, 120).mean() * 100))
            q = (gross // 32 * 32).reshape(-1, 3)
            toene.append(len(set(map(tuple, q))))
        n += 1
    cap.release()

    if not bewegt:
        raise SystemExit(f"'{pfad}' hat zu wenige Frames.")
    mv = np.array(bewegt)
    return {
        "frames":    len(mv),
        "sekunden":  len(mv) / fps,
        "standbild": float((mv < STANDBILD_SCHWELLE).mean()),
        "bewegung":  float(np.median(mv)),
        "kanten":    float(np.mean(kanten)),
        "farbtoene": float(np.mean(toene)),
    }


def pruefen(m):
    """-> Liste von (bestanden, Text)."""
    G = GRENZEN
    return [
        (m["standbild"] <= G["standbild_max"],
         f"eingefrorene Frames {m['standbild']*100:5.1f} %  (erlaubt bis "
         f"{G['standbild_max']*100:.0f} %, Referenzen 2-13 %)"),
        (m["bewegung"] >= G["bewegung_min"],
         f"bewegte Flaeche  {m['bewegung']*100:5.2f} %  (mindestens "
         f"{G['bewegung_min']*100:.1f} %, Referenzen 0,6-5,1 %)"),
        (m["kanten"] >= G["kanten_min"],
         f"Kantendichte     {m['kanten']:5.0f}    (mindestens "
         f"{G['kanten_min']:.0f}, Referenzen 497-1066)"),
        (m["farbtoene"] >= G["farbtoene_min"],
         f"Farbtoene/Bild   {m['farbtoene']:5.0f}    (mindestens "
         f"{G['farbtoene_min']}, Referenzen 106-124)"),
    ]


def bericht(pfad):
    m = messen(pfad)
    print(f"\n{os.path.basename(pfad)}  ({m['sekunden']:.1f}s, {m['frames']} Frames)")
    schlecht = 0
    for ok, text in pruefen(m):
        print(f"  {'OK  ' if ok else 'FAIL'}  {text}")
        schlecht += 0 if ok else 1
    if schlecht:
        print(f"  -> {schlecht} von 4 Kriterien verfehlt. Das Video liest sich "
              f"als Standbildfolge, nicht als Motion Graphics.")
    return schlecht


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    fehler = sum(bericht(p) for p in sys.argv[1:])
    sys.exit(1 if fehler else 0)

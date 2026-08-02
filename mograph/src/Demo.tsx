/**
 * DEMO — Beleg, dass die Technik jetzt stimmt.
 *
 * Drei Szenen, die jeweils EINE Sache zeigen, die vorher unmoeglich war:
 *
 *   01  Die Figur ist ein Rig. Sie hebt die Arme, neigt den Kopf, oeffnet den
 *       Mund, blinzelt - jeder Frame eine andere Pose. Die Zahl zaehlt hoch,
 *       statt einfach dazustehen.
 *   02  Ein Pfad zeichnet sich, ein Objekt reist darauf mit und richtet sich in
 *       Fahrtrichtung aus. Die Balken wachsen versetzt aus der Grundlinie.
 *   03  Eine Form morpht in eine andere - die Kanten wandern wirklich, es ist
 *       kein Ein-/Ausblenden.
 *
 * Alles auf Zweien animiert (`posterize: 2`), damit es nicht wie eine
 * Computerinterpolation aussieht.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Figur, STANDARD_FARBEN } from "./rig/Figur";
import { handlung } from "./rig/handlung";
import { Balken, KURVE, Morph, Pfadreise, Wortaufbau, Zaehler, bogenPfad, fortschritt } from "./motion/kit";

const P = {
  bg: "#F4F1EA",
  tief: "#232F4E",
  akzent: "#F96313",
  kalt: "#2FB6A8",
  sand: "#F7C96E",
};

const SCHRIFT = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ------------------------------------------------------------------ Szene 1
const Szene1: React.FC = () => {
  const frame = useCurrentFrame();
  const pose = handlung("ueberfordert", frame, 10);
  // sanfter Push - die Kamera steht nie ganz still
  const zoom = interpolate(frame, [0, 110], [1, 1.05], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: P.bg }}>
      <AbsoluteFill style={{ scale: zoom }}>
        <div style={{ position: "absolute", left: 110, top: 130 }}>
          <Figur pose={pose} breite={560} farben={STANDARD_FARBEN} />
        </div>

        <div style={{ position: "absolute", left: 880, top: 290, fontFamily: SCHRIFT }}>
          <Zaehler
            bis={40}
            zeit={{ von: 28, dauer: 40 }}
            stil={{ fontSize: 300, fontWeight: 900, color: P.akzent, lineHeight: 1 }}
          />
          <Wortaufbau
            text="Anrufe jeden Tag"
            zeit={{ von: 62, dauer: 12 }}
            stil={{ fontSize: 72, fontWeight: 800, color: P.tief, marginTop: 8 }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ Szene 2
const PFAD = bogenPfad([220, 760], [1560, 330], "termin", 190, 70);

const Szene2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: P.tief }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
        <Pfadreise
          d={PFAD}
          zeit={{ von: 6, dauer: 52 }}
          farbe={P.akzent}
          breite={16}
          reisender={
            <>
              <circle r={26} fill={P.akzent} />
              <path d="M -9 -11 L 12 0 L -9 11 Z" fill="#fff" />
            </>
          }
        />
        <Balken
          werte={[3, 5, 4, 8, 11, 14]}
          zeit={{ von: 58, dauer: 22 }}
          farbe={(i) => (i >= 4 ? P.akzent : P.kalt)}
          x={1120}
          y={430}
          breite={640}
          hoehe={470}
        />
      </svg>
      <div style={{ position: "absolute", left: 150, top: 150, fontFamily: SCHRIFT }}>
        <Wortaufbau
          text="Jeder Termin findet den Weg"
          zeit={{ von: 14, dauer: 14 }}
          stil={{ fontSize: 76, fontWeight: 900, color: "#fff", maxWidth: 760 }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ Szene 3
// Zwei strukturell verwandte Formen - so bleibt das Morphing sauber.
const TELEFON = "M 660 300 q 0 -40 40 -40 l 200 0 q 40 0 40 40 l 0 480 q 0 40 -40 40 l -200 0 q -40 0 -40 -40 z";
const KALENDER = "M 520 340 q 0 -40 40 -40 l 480 0 q 40 0 40 40 l 0 400 q 0 40 -40 40 l -480 0 q -40 0 -40 -40 z";

const Szene3: React.FC = () => {
  const frame = useCurrentFrame();
  const pose = handlung("zeigen", frame, 34);
  const p = fortschritt(frame, { von: 8, dauer: 30 }, KURVE.ruhig);

  return (
    <AbsoluteFill style={{ backgroundColor: P.bg }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
        <Morph von={TELEFON} nach={KALENDER} zeit={{ von: 8, dauer: 30 }} fill={P.tief} />
        {/* Rasterpunkte im Kalender erscheinen erst, wenn die Form angekommen ist */}
        {Array.from({ length: 21 }).map((_, i) => {
          const zeile = Math.floor(i / 7);
          const spalte = i % 7;
          const q = fortschritt(frame, { von: 36 + i * 1.4, dauer: 10 }, KURVE.ueberschwung, 2);
          return (
            <rect
              key={i}
              x={568 + spalte * 62}
              y={392 + zeile * 62}
              width={44 * q}
              height={44 * q}
              rx={9}
              fill={i === 11 ? P.akzent : "#5C6B94"}
              opacity={p > 0.85 ? 1 : 0}
              transform={`translate(${(44 * (1 - q)) / 2} ${(44 * (1 - q)) / 2})`}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 1180, top: 170 }}>
        <Figur pose={pose} breite={500} />
      </div>
    </AbsoluteFill>
  );
};

export const Demo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={4 * fps} layout="none">
        <Szene1 />
      </Sequence>
      <Sequence from={4 * fps} durationInFrames={4 * fps} layout="none">
        <Szene2 />
      </Sequence>
      <Sequence from={8 * fps} durationInFrames={4 * fps} layout="none">
        <Szene3 />
      </Sequence>
    </AbsoluteFill>
  );
};

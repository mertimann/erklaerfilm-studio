/**
 * UI — die eine Bauchbinde und die Schritt-Marke. In JEDER Szene identisch
 * positioniert und gesetzt. Konsistenz ist hier wichtiger als Abwechslung -
 * der Ort wechselt pro Szene, die Typografie nie.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { p, Worte } from "./lib";
import { C, E, SCHRIFT } from "./basis";

export const Bauchbinde: React.FC<{
  kicker: string; text: string; start: number; hell?: boolean;
}> = ({ kicker, text, start, hell }) => {
  const frame = useCurrentFrame();
  const ink = hell ? "#14243E" : C.text;
  return (
    <div style={{ position: "absolute", left: 150, bottom: 64, width: 1560 }}>
      <div
        style={{
          fontFamily: SCHRIFT, fontSize: 32, fontWeight: 800, letterSpacing: "0.18em",
          color: C.waerme, opacity: p(frame, start - 6, 8),
          translate: `0px ${((1 - p(frame, start - 6, 10)) * 18).toFixed(1)}px`,
        }}
      >
        {kicker}
      </div>
      <Worte text={text} start={start} proWort={2}
        stil={{ fontSize: 62, fontWeight: 900, color: ink, marginTop: 6 }} />
    </div>
  );
};

/** Nummerierte Schritt-Marke - macht die Dreiteilung sichtbar. */
export const Schritt: React.FC<{ n: number; titel: string; start: number }> = ({ n, titel, start }) => {
  const frame = useCurrentFrame();
  const q = p(frame, start, 12, E.ueber);
  const t = p(frame, start + 6, 12);
  return (
    <div style={{ position: "absolute", left: 150, top: 110, display: "flex", alignItems: "center", gap: 30 }}>
      <div
        style={{
          width: 104, height: 104, borderRadius: "50%", backgroundColor: C.waerme,
          color: "#FFF", fontFamily: SCHRIFT, fontSize: 60, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          scale: `${q.toFixed(3)}`,
        }}
      >
        {n}
      </div>
      <span
        style={{
          fontFamily: SCHRIFT, fontSize: 58, fontWeight: 900, color: "#14243E",
          opacity: t, translate: `${((1 - t) * -26).toFixed(1)}px 0px`,
        }}
      >
        {titel}
      </span>
    </div>
  );
};

/**
 * Untertitel — dezent: klein, halbtransparent, unten mittig, ohne Kasten.
 * Segmente = [Text, Startframe]; das jeweils letzte erreichte Segment zaehlt.
 */
export const Untertitel: React.FC<{
  segmente: Array<[string, number]>; hell?: boolean;
}> = ({ segmente, hell }) => {
  const frame = useCurrentFrame();
  let text = ""; let start = 0;
  for (const [t, s] of segmente) if (frame >= s) { text = t; start = s; }
  if (!text) return null;
  const q = p(frame, start + 2, 8);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1480, textAlign: "center", fontFamily: SCHRIFT, fontSize: 33, fontWeight: 600,
        color: hell ? "rgba(23,38,63,0.66)" : "rgba(255,255,255,0.85)",
        // Lichthof in der Grundfarbe: bleibt lesbar, wenn eine Figur dahinter steht
        textShadow: hell
          ? "0 0 14px #F4EFE6, 0 0 8px #F4EFE6, 0 0 4px #F4EFE6"
          : "0 0 14px rgba(180,74,12,0.9), 0 0 8px rgba(180,74,12,0.9)",
        opacity: q }}>
        {text}
      </div>
    </div>
  );
};

/** Überschrift — EINE kurze Zeile im Leerraum der Szene, kein Titel-Kasten. */
export const Ueberschrift: React.FC<{
  text: string; start?: number; hell?: boolean; x?: number; y?: number;
}> = ({ text, start = 8, hell, x = 150, y = 140 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 900 }}>
    <Worte text={text} start={start} proWort={2}
      stil={{ fontSize: 62, fontWeight: 900, color: hell ? "#17263F" : "#FFFFFF" }} />
  </div>
);

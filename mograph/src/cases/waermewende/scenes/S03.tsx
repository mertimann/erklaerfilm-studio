/**
 * S03 — "Die Lösung von WärmeWende: mieten. Und das geht so:"  (3,94 s)
 * Kapitelwechsel: volles Orange. KAUFEN wird durchgestrichen und macht Platz,
 * MIETEN setzt sich gross - dann kuendigen drei nummerierte Punkte die
 * Schritte an. Das ist die Gliederung des Films, sichtbar gemacht.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, Zeichnet } from "../../../bausteine/lib";
import { Untertitel } from "../../../bausteine/ui";

export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const weg = p(frame, 26, 14, E.abgang);
  const mieten = p(frame, 34, 12, E.ueber);

  return (
    <AbsoluteFill style={{ backgroundColor: C.waerme }}>
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(80% 80% at 30% 20%, rgba(255,255,255,0.14) 0%, transparent 60%)" }} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: p(frame, 4, 10) }}>
        <span style={{ fontFamily: SCHRIFT, fontSize: 38, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "0.22em" }}>DIE LÖSUNG</span>
      </div>

      {/* KAUFEN wird durchgestrichen und zieht ab */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center",
        translate: `0px ${(-weg * 320).toFixed(0)}px`, opacity: 1 - weg }}>
        <span style={{ fontFamily: SCHRIFT, fontSize: 130, fontWeight: 900, color: "#FFD9BE" }}>KAUFEN</span>
        <svg width={620} height={30} style={{ position: "absolute", left: "50%", top: 74, marginLeft: -310 }}>
          <Zeichnet d="M 10 15 L 610 15" start={8} dauer={10} farbe="#14243E" breite={16} />
        </svg>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center",
        scale: `${(0.6 + mieten * 0.4).toFixed(3)}`, opacity: mieten }}>
        <span style={{ fontFamily: SCHRIFT, fontSize: 250, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>MIETEN</span>
      </div>

      {/* Ankuendigung der drei Schritte */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex",
        justifyContent: "center", gap: 70 }}>
        {[1, 2, 3].map((n, i) => {
          const q = p(frame, 62 + i * 7, 12, E.ueber);
          return (
            <div key={n} style={{ width: 120, height: 120, borderRadius: "50%",
              backgroundColor: "#FFFFFF", color: C.waermeDunkel,
              fontFamily: SCHRIFT, fontSize: 64, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              scale: `${q.toFixed(3)}` }}>{n}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center",
        opacity: p(frame, 80, 10) }}>
        <span style={{ fontFamily: SCHRIFT, fontSize: 46, fontWeight: 800, color: "#FFF" }}>In drei Schritten:</span>
      </div>
      <Untertitel segmente={[["Bei WärmeWende mieten Sie Ihre Wärmepumpe einfach.", 4]]} />
    </AbsoluteFill>
  );
};

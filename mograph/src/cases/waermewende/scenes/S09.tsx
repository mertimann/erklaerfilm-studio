/**
 * S09 — "WärmeWende. Wärmepumpe mieten statt kaufen. Jetzt beraten lassen." (6,63 s)
 * Warmer Abschluss. Wortmarke setzt sich zusammen, Preis, pulsierende
 * Schaltflaeche - und rechts laeuft das Geraet, um das es die ganze Zeit ging.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, Zeichnet, schwingt } from "../../../bausteine/lib";
import { Aussengeraet, Label } from "../../../bausteine/geraete";
import { Untertitel } from "../../../bausteine/ui";


export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const a = p(frame, 6, 20, E.auftritt);
  const b = p(frame, 12, 20, E.auftritt);
  const puls = 1 + Math.sin(frame / 7) * 0.02;

  return (
    <AbsoluteFill style={{ backgroundColor: C.waermeDunkel }}>
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #D45B12 0%, #F96313 55%, #FFA05C 100%)" }} />
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
          <rect x={0} y={900} width={1920} height={180} fill="#B24A0C" />
          <g opacity={p(frame, 30, 16)}>
            <Aussengeraet x={1510} y={790} s={1.05} an={1} />
          </g>
          <Label x={1510} y={560} text="ab 189 € im Monat" start={64} zeiger={70} />
        </svg>

        <div style={{ position: "absolute", left: 150, top: 250, fontFamily: SCHRIFT }}>
          <div style={{ fontSize: 150, fontWeight: 900, color: "#FFF", letterSpacing: "-0.03em" }}>
            <span style={{ display: "inline-block", translate: `${((1 - a) * -220).toFixed(0)}px 0px`, opacity: a }}>Wärme</span>
            <span style={{ display: "inline-block", translate: `${((1 - b) * 220).toFixed(0)}px 0px`, opacity: b, color: "#14243E" }}>Wende</span>
          </div>
          <svg width={640} height={14} style={{ marginTop: 4 }}>
            <Zeichnet d="M 0 7 L 640 7" start={30} dauer={14} farbe="#FFF" breite={9} />
          </svg>
          <div style={{ marginTop: 30, fontSize: 56, fontWeight: 800, color: "#FFF", opacity: p(frame, 44, 12) }}>
            Wärmepumpe mieten statt kaufen
          </div>
          <div style={{ marginTop: 48, display: "inline-block",
            scale: `${(p(frame, 96, 14, E.ueber) * puls).toFixed(3)}`,
            rotate: `${schwingt(frame, 110, 0.7).toFixed(2)}deg`, transformOrigin: "0% 50%" }}>
            <div style={{ backgroundColor: "#14243E", color: "#FFF", fontSize: 48, fontWeight: 900,
              padding: "26px 58px", borderRadius: 18 }}>Jetzt kostenlos beraten lassen</div>
          </div>
        </div>
      </AbsoluteFill>
      <Untertitel segmente={[["WärmeWende – Wärmepumpe mieten statt kaufen.", 4], ["Jetzt kostenlos beraten lassen.", 110]]} />
    </AbsoluteFill>
  );
};

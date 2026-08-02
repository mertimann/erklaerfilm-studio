/**
 * S07 — "Wenn doch mal etwas kaputtgeht: Unser Service kommt. Kostenlos." (4,77 s)
 * Gleiche helle Buehne. Das Geraet stottert, der Handwerker kommt herein,
 * setzt den Schluessel an, es laeuft wieder - die Rechnung zeigt 0 €.
 * Kein Farbwechsel, kein Titel: der Vorgang erzaehlt sich selbst.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, schwingt } from "../../../bausteine/lib";
import { Techniker } from "../../../bausteine/welt";
import { Aussengeraet } from "../../../bausteine/geraete";
import { Ueberschrift, Untertitel } from "../../../bausteine/ui";

export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const kaputt = p(frame, 4, 6);
  const kommt = p(frame, 18, 24, E.auftritt);
  const repariert = p(frame, 66, 12, E.ueber);
  const defekt = Math.max(0, kaputt - repariert);
  const tap = schwingt(frame, 48, 8, 20) + schwingt(frame, 58, 6, 16);

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
        <rect x={0} y={860} width={1920} height={220} fill="#E7DFD2" />
        <rect x={0} y={860} width={1920} height={5} fill="#C9BFAE" />

        <Aussengeraet x={1240} y={720} s={1.4} an={1 - defekt} defekt={defekt} />
        {/* kleine Funken, solange es steht */}
        {Array.from({ length: 5 }).map((_, i) => {
          const t = ((frame * 2.6 + i * 16) % 36) / 36;
          return <circle key={i} cx={1240 + Math.cos(i * 2.2) * (90 + t * 90)}
            cy={700 + Math.sin(i * 2.2) * (60 + t * 70)}
            r={8 * (1 - t)} fill={C.rot} opacity={(1 - t) * defekt * 0.9} />;
        })}

        {/* Der Handwerker kommt und arbeitet */}
        <g transform={`translate(${(880 - (1 - kommt) * 560).toFixed(1)} ${(1006 + Math.sin(frame / 4) * 3 * (kommt < 0.97 ? 1 : 0)).toFixed(1)})`}
           opacity={kommt}>
          <Techniker x={0} y={0} s={1.15} arm={p(frame, 40, 12) * 0.85} kopf={5} />
        </g>
        {/* Schraubenschluessel in Arbeitsposition, tickt zweimal */}
        <g transform={`translate(1040 610) rotate(${(-28 + tap).toFixed(1)})`}
           opacity={p(frame, 40, 10) * (1 - p(frame, 78, 10, E.abgang))}>
          <rect x={-13} y={0} width={26} height={170} rx={10} fill="#6B7899" />
          <path d="M -34 0 q 0 -40 34 -40 q 34 0 34 40 l -22 0 q 0 -17 -12 -17 q -12 0 -12 17 z" fill="#8A97B0" />
        </g>
      </svg>

      {/* Rechnung 0 EUR - im Leerraum oben links */}
      <Ueberschrift text="Kaputt? Service kommt." start={8} hell />
      <div style={{ position: "absolute", left: 150, top: 270, opacity: p(frame, 82, 12),
        scale: `${(0.8 + 0.2 * p(frame, 82, 14, E.ueber)).toFixed(3)}`, transformOrigin: "0% 0%" }}>
        <div style={{ background: "#FFF", border: "6px solid #31456B", borderRadius: 20,
          overflow: "hidden", width: 360, fontFamily: SCHRIFT }}>
          <div style={{ background: C.waerme, color: "#FFF", fontSize: 30, fontWeight: 900,
            padding: "14px 0", textAlign: "center", letterSpacing: "0.12em" }}>RECHNUNG</div>
          <div style={{ fontSize: 120, fontWeight: 900, color: "#17263F", textAlign: "center",
            padding: "20px 0 28px" }}>0 €</div>
        </div>
      </div>
      <Untertitel hell segmente={[["Wenn doch mal etwas kaputtgeht: Unser Service kommt. Kostenlos.", 4]]} />
    </AbsoluteFill>
  );
};

/**
 * S08 — "Ihre 35.000 Euro? Bleiben einfach auf Ihrem Konto."  (4,91 s)
 * Statt Sparschwein: eine saubere Konto-Karte. Muenzen fallen in den Schlitz,
 * der Stand zaehlt auf +35.000. Gleiche Farbwelt, kein Titel.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, schwingt } from "../../../bausteine/lib";
import { Ueberschrift, Untertitel } from "../../../bausteine/ui";

export const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const da = p(frame, 6, 16, E.ueber);

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
        <rect x={0} y={860} width={1920} height={220} fill="#E7DFD2" />
        <rect x={0} y={860} width={1920} height={5} fill="#C9BFAE" />

        {/* Konto-Karte */}
        <g transform={`translate(960 ${(560 + (1 - da) * 80).toFixed(1)}) rotate(${schwingt(frame, 56, 0.8).toFixed(2)})`}
           opacity={da}>
          <rect x={-330} y={-190} width={660} height={400} rx={30} fill="#17263F" />
          <rect x={-330} y={-190} width={660} height={400} rx={30} fill="none" stroke="#31456B" strokeWidth={4} />
          {/* Schlitz oben */}
          <rect x={-110} y={-206} width={220} height={26} rx={13} fill="#31456B" />
          <text x={-282} y={-110} fontFamily={SCHRIFT} fontSize={34} fontWeight={800} fill="#8FA0BC" letterSpacing="0.14em">IHR KONTO</text>
          <line x1={-282} y1={-80} x2={282} y2={-80} stroke="#31456B" strokeWidth={3} />
          <text x={0} y={70} textAnchor="middle" fontFamily={SCHRIFT} fontSize={128} fontWeight={900} fill={C.waermeHell}>
            +{Math.round(35000 * p(frame, 34, 48, E.auftritt, 2)).toLocaleString("de-DE")} €
          </text>
          <text x={0} y={150} textAnchor="middle" fontFamily={SCHRIFT} fontSize={36} fontWeight={700} fill="#8FA0BC">bleibt bei Ihnen</text>
        </g>

        {/* Muenzen fallen in den Schlitz */}
        {Array.from({ length: 9 }).map((_, i) => {
          const q = p(frame, 18 + i * 9, 24, E.ruhig);
          if (q < 0.02 || q > 0.97) return null;
          return (
            <g key={i} transform={`translate(960 ${(140 + q * 220).toFixed(0)})`}>
              <ellipse rx={32} ry={32 * Math.max(0.3, Math.abs(Math.cos(q * 4)))} fill={C.sand}
                stroke={C.waermeDunkel} strokeWidth={4} />
            </g>
          );
        })}
      </svg>
      <Ueberschrift text="35.000 € gespart" start={8} hell />
      <Untertitel hell segmente={[["Ihre 35.000 Euro bleiben einfach auf Ihrem Konto.", 4]]} />
    </AbsoluteFill>
  );
};

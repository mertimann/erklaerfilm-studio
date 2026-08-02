/**
 * S02 — "Das Problem: Kaufen kostet rund 35.000 Euro."  (6,38 s)
 * Gleiche Buehne, gleiches Licht. Das Preisschild faellt schwer neben das
 * Geraet - Rot nur im Schildkopf, sonst bleibt die Farbwelt stehen.
 * Kein Zoom, keine Textzeile: das Schild IST die Aussage.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, schwingt } from "../../../bausteine/lib";
import { Aussengeraet } from "../../../bausteine/geraete";
import { Ueberschrift, Untertitel } from "../../../bausteine/ui";

export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const fall = p(frame, 22, 14, E.abgang);
  const setzt = schwingt(frame, 36, 12, 26);

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
        <rect x={0} y={860} width={1920} height={220} fill="#E7DFD2" />
        <rect x={0} y={860} width={1920} height={5} fill="#C9BFAE" />
        <Aussengeraet x={620} y={720} s={1.45} an={1} />

        {/* Das Preisschild faellt und setzt auf */}
        <g transform={`translate(1310 ${(300 + fall * 300 + setzt).toFixed(1)})`} opacity={p(frame, 20, 6)}>
          <rect x={-310} y={0} width={620} height={310} rx={26} fill="#FFFFFF" stroke="#31456B" strokeWidth={8} />
          <rect x={-310} y={0} width={620} height={82} rx={26} fill={C.rot} />
          <rect x={-310} y={44} width={620} height={38} fill={C.rot} />
          <text y={58} textAnchor="middle" fontFamily={SCHRIFT} fontSize={40} fontWeight={900} fill="#FFF" letterSpacing="0.12em">KAUFPREIS</text>
          <text y={232} textAnchor="middle" fontFamily={SCHRIFT} fontSize={124} fontWeight={900} fill="#17263F">
            {Math.round(35000 * p(frame, 38, 50, E.auftritt, 2)).toLocaleString("de-DE")} €
          </text>
        </g>
        {/* Staub beim Aufsetzen */}
        {Array.from({ length: 6 }).map((_, i) => {
          const q = p(frame, 36 + i, 22, E.abgang);
          return <circle key={i} cx={1310 + (i - 2.5) * 130 * q} cy={892} r={12 * (1 - q)}
            fill="#C9BFAE" opacity={q > 0.02 ? (1 - q) * 0.8 : 0} />;
        })}
      </svg>
      <Ueberschrift text="Das Problem: der Kaufpreis" start={6} hell />
      <Untertitel hell segmente={[["Kaufen kostet rund 35.000 Euro.", 4]]} />
    </AbsoluteFill>
  );
};

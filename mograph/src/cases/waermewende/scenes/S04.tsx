/**
 * S04 — "Schritt eins: kostenlose Beratung. Wir prüfen Ihr Haus."  (6,01 s)
 * Kapitelwechsel auf HELL: Creme-Grund, navy Linien. Der Hausumriss zeichnet
 * sich, eine Lupe wandert von Station zu Station, an jeder erscheint ein Haken
 * mit Beschriftung. Beratung = pruefen, sichtbar gemacht.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, Zeichnet, Haken } from "../../../bausteine/lib";
import { Schritt, Untertitel } from "../../../bausteine/ui";

const HAUS = "M 700 760 L 700 480 L 960 320 L 1220 480 L 1220 760 Z M 1100 400 L 1100 330 L 1160 330 L 1160 437";
const STATIONEN: Array<[number, number, string, number]> = [
  [960, 360, "Dach", 55],
  [724, 600, "Heizung", 95],
  [1190, 700, "Aufstellort", 135],
];

export const S04: React.FC = () => {
  const frame = useCurrentFrame();

  // Lupe wandert zwischen den Stationen
  const seg1 = p(frame, 50, 34, E.ruhig);
  const seg2 = p(frame, 96, 34, E.ruhig);
  const lx = 960 + (724 - 960) * seg1 + (1190 - 724) * seg2;
  const ly = 360 + (600 - 360) * seg1 + (700 - 600) * seg2;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <rect x={0} y={760} width={1920} height={4} fill="#D8CFC0" />
          <Zeichnet d={HAUS} start={8} dauer={40} farbe="#14243E" breite={10} />
          {/* Tuer + Fenster im Umriss */}
          <g opacity={p(frame, 44, 12)}>
            <rect x={900} y={620} width={120} height={140} rx={8} fill="none" stroke="#14243E" strokeWidth={8} />
            <rect x={760} y={520} width={110} height={95} rx={8} fill="none" stroke="#14243E" strokeWidth={8} />
            <rect x={1050} y={520} width={110} height={95} rx={8} fill="none" stroke="#14243E" strokeWidth={8} />
          </g>

          {/* Stationen: Haken + Beschriftung, sobald die Lupe da war */}
          {STATIONEN.map(([sx, sy, name, start], i) => (
            <g key={name} opacity={p(frame, start + 12, 8)}>
              <circle cx={sx} cy={sy} r={13} fill={C.waerme} />
              {/* Station 3 unter den Punkt - im Haus ist der Text nicht lesbar */}
              <text x={i === 2 ? sx - 110 : sx - 30} y={i === 2 ? sy + 100 : sy - 26}
                textAnchor={i === 2 ? "middle" : "end"}
                fontFamily={SCHRIFT} fontSize={38} fontWeight={800} fill="#14243E">{name}</text>
            </g>
          ))}

          {/* Die Lupe */}
          <g transform={`translate(${lx.toFixed(1)} ${ly.toFixed(1)})`} opacity={p(frame, 36, 12)}>
            <circle r={74} fill="rgba(249,99,19,0.10)" stroke={C.waerme} strokeWidth={12} />
            <line x1={52} y1={52} x2={112} y2={112} stroke={C.waerme} strokeWidth={18} strokeLinecap="round" />
          </g>
        </svg>

        {/* Haken-Liste rechts */}
        <div style={{ position: "absolute", right: 170, top: 300 }}>
          {["geprüft", "geplant", "gefördert"].map((t, i) => {
            const q = p(frame, 70 + i * 34, 12);
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30,
                opacity: q, translate: `${((1 - q) * 60).toFixed(0)}px 0px` }}>
                <Haken start={72 + i * 34} groesse={56} farbe={C.waerme} />
                <span style={{ fontFamily: SCHRIFT, fontSize: 48, fontWeight: 800, color: "#14243E" }}>{t}</span>
              </div>
            );
          })}
        </div>

        <Schritt n={1} titel="Kostenlose Beratung" start={6} />
      </AbsoluteFill>
      <Untertitel hell segmente={[["Schritt eins: kostenlose Beratung.", 4], ["Wir prüfen Ihr Haus und planen die passende Anlage.", 72]]} />
    </AbsoluteFill>
  );
};

/**
 * S05 — "Schritt zwei: Unsere Monteure bauen alles ein. Meist an einem Tag." (5,61 s)
 * Hell. Der Techniker schiebt das Geraet auf einem Rollwagen an die Wand,
 * es dockt mit Nachschwingen an, zwei Leitungen zeichnen sich zur Wand.
 * "1 Tag"-Chip mit Sonne. Arbeit als Vorgang, nicht als Behauptung.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, schwingt, Zeichnet } from "../../../bausteine/lib";
import { Techniker } from "../../../bausteine/welt";
import { Aussengeraet } from "../../../bausteine/geraete";
import { Schritt, Untertitel } from "../../../bausteine/ui";

export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const fahrt = p(frame, 8, 44, E.ruhig);
  const dockt = schwingt(frame, 52, 10, 24);
  const px = 300 + fahrt * 880;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <rect x={0} y={860} width={1920} height={220} fill="#E7DFD2" />
          <rect x={0} y={860} width={1920} height={5} fill="#C9BFAE" />
          {/* Hauswand rechts */}
          <rect x={1560} y={340} width={360} height={520} fill="#17263F" />
          <rect x={1560} y={340} width={16} height={520} fill="#0D1830" />
          <rect x={1660} y={430} width={170} height={150} rx={10} fill="#FFCF7A" opacity={0.85} />

          {/* Rollwagen + Geraet */}
          <g transform={`translate(${(px + dockt).toFixed(1)} 0)`}>
            <rect x={-190} y={806} width={380} height={22} rx={10} fill="#8A5A3B" />
            <g transform={`rotate(${(-fahrt * 720).toFixed(0)} -120 852)`}>
              <circle cx={-120} cy={852} r={26} fill="#14243E" /><circle cx={-120} cy={852} r={10} fill="#F4EFE6" />
            </g>
            <g transform={`rotate(${(-fahrt * 720).toFixed(0)} 120 852)`}>
              <circle cx={120} cy={852} r={26} fill="#14243E" /><circle cx={120} cy={852} r={10} fill="#F4EFE6" />
            </g>
            <Aussengeraet x={0} y={666} s={1.1} an={p(frame, 96, 20)} />
          </g>

          {/* Techniker schiebt */}
          <g transform={`translate(${(px - 330).toFixed(1)} ${(1006 + Math.sin(frame / 4) * 3 * (fahrt < 0.97 ? 1 : 0)).toFixed(1)})`}>
            <Techniker x={0} y={0} s={1.1} arm={0.62} kopf={4} />
          </g>

          {/* Leitungen zur Wand, nach dem Andocken */}
          <Zeichnet d="M 1372 700 L 1560 700" start={70} dauer={12} farbe="#14243E" breite={12} />
          <Zeichnet d="M 1372 740 L 1560 740" start={76} dauer={12} farbe={C.waerme} breite={12} />
        </svg>

        {/* 1-Tag-Chip */}
        <div style={{ position: "absolute", left: 900, top: 150, display: "flex", alignItems: "center", gap: 22,
          opacity: p(frame, 92, 10), scale: `${(0.7 + 0.3 * p(frame, 92, 12, E.ueber)).toFixed(3)}` }}>
          <svg width={72} height={72} viewBox="0 0 72 72">
            <circle cx={36} cy={36} r={17} fill={C.waerme} />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1={36 + Math.cos((i * Math.PI) / 4) * 25} y1={36 + Math.sin((i * Math.PI) / 4) * 25}
                x2={36 + Math.cos((i * Math.PI) / 4) * 33} y2={36 + Math.sin((i * Math.PI) / 4) * 33}
                stroke={C.waerme} strokeWidth={6} strokeLinecap="round" />
            ))}
          </svg>
          <span style={{ fontFamily: SCHRIFT, fontSize: 56, fontWeight: 900, color: "#14243E" }}>in 1 Tag</span>
        </div>

        <Schritt n={2} titel="Einbau" start={6} />
      </AbsoluteFill>
      <Untertitel hell segmente={[["Schritt zwei: Unsere Monteure bauen alles ein.", 4], ["Meistens an einem einzigen Tag.", 100]]} />
    </AbsoluteFill>
  );
};

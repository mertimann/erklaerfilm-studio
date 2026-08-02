/**
 * GERAETE — die erkennbaren Gegenstaende.
 *
 * Kritik, die hierher gefuehrt hat: "Wenn ich das als Werbung sehe, wuerde ich
 * nicht erkennen, dass es eine Waermepumpe ist." Zwei Konsequenzen:
 *   1. Das Aussengeraet ist detailliert gezeichnet (Lamellen, Luefterrad,
 *      Anschluesse) statt als Kasten mit Kreis.
 *   2. Dinge werden BESCHRIFTET - das ist eine Erklaervideo-Konvention, keine
 *      Verlegenheitsloesung.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { p } from "./lib";
import { E, SCHRIFT } from "./basis";

/** Wärmepumpen-Außengerät. `an` 0..1 steuert das Lüfterrad, `defekt` das Zittern. */
export const Aussengeraet: React.FC<{
  x: number; y: number; s?: number; an?: number; defekt?: number;
}> = ({ x, y, s = 1, an = 1, defekt = 0 }) => {
  const frame = useCurrentFrame();
  const zitter = defekt > 0 ? Math.sin(frame / 2.2) * 3 * defekt : 0;
  return (
    <g transform={`translate(${x} ${(y + zitter).toFixed(1)}) scale(${s})`}>
      <rect x={-150} y={116} width={44} height={24} rx={6} fill="#6B7899" />
      <rect x={106} y={116} width={44} height={24} rx={6} fill="#6B7899" />
      <rect x={-180} y={-120} width={360} height={240} rx={22} fill="#FFFFFF" />
      <rect x={-180} y={-120} width={360} height={240} rx={22} fill="none" stroke="#31456B" strokeWidth={5} />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={-152} y={-88 + i * 32} width={124} height={14} rx={7} fill="#C9D3E2" />
      ))}
      <circle cx={84} cy={0} r={86} fill="#E3E9F2" />
      <circle cx={84} cy={0} r={86} fill="none" stroke="#31456B" strokeWidth={5} />
      <g transform={`rotate(${(frame * 7 * an).toFixed(1)} 84 0)`}>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d="M 84 -6 q 34 -44 62 -18 q -18 34 -62 30 z" fill="#7E8DA9" transform={`rotate(${a} 84 0)`} />
        ))}
      </g>
      <circle cx={84} cy={0} r={16} fill="#F96313" />
      <rect x={178} y={28} width={36} height={12} rx={6} fill="#6B7899" />
      <rect x={178} y={56} width={36} height={12} rx={6} fill="#6B7899" />
    </g>
  );
};

/** Beschriftungs-Chip mit Zeiger. Dinge benennen, damit man sie erkennt. */
export const Label: React.FC<{
  x: number; y: number; text: string; start: number; hell?: boolean; zeiger?: number;
}> = ({ x, y, text, start, hell, zeiger = 56 }) => {
  const frame = useCurrentFrame();
  const q = p(frame, start, 12, E.ueber);
  const b = Math.max(150, text.length * 21 + 56);
  const bg = hell ? "#FFFFFF" : "#14243E";
  const ink = hell ? "#14243E" : "#FFFFFF";
  return (
    <g transform={`translate(${x} ${y}) scale(${(0.6 + 0.4 * q).toFixed(3)})`} opacity={q}>
      <line x1={0} y1={34} x2={0} y2={34 + zeiger} stroke={bg} strokeWidth={5} />
      <circle cx={0} cy={34 + zeiger} r={7} fill={bg} />
      <rect x={-b / 2} y={-34} width={b} height={68} rx={34} fill={bg} />
      <text y={13} textAnchor="middle" fontFamily={SCHRIFT} fontSize={34} fontWeight={800} fill={ink}>{text}</text>
    </g>
  );
};

/** Luftstrom: Pfeilspitzen, die zur Pumpe ziehen. Erklaert, WOHER die Waerme kommt. */
export const LuftStrom: React.FC<{
  x: number; y: number; aktiv?: number; farbe?: string;
}> = ({ x, y, aktiv = 1, farbe = "#7FD4E8" }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 9 }).map((_, i) => {
        const reihe = i % 3;
        const t = ((frame * 2.2 + i * 34) % 100) / 100;
        return (
          <path
            key={i}
            d="M 0 -13 L 17 0 L 0 13"
            fill="none"
            stroke={farbe}
            strokeWidth={7}
            strokeLinecap="round"
            transform={`translate(${(x - 250 + t * 230).toFixed(1)} ${y - 44 + reihe * 44})`}
            opacity={Math.sin(t * Math.PI) * 0.9 * aktiv}
          />
        );
      })}
    </>
  );
};

/** Punkte, die einen Rohrpfad entlangwandern - der Waermefluss ins Haus. */
export const FlussPunkte: React.FC<{
  d: string; start: number; farbe: string; n?: number; r?: number; tempo?: number;
}> = ({ d, start, farbe, n = 6, r = 9, tempo = 110 }) => {
  const frame = useCurrentFrame();
  const L = getLength(d);
  if (frame < start) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const lauf = Math.min(1, (frame - start) / 18);
        const t = ((frame - start) * (L / tempo) + i * (L / n)) % L;
        if (t > L * lauf + 2) return null;
        const pt = getPointAtLength(d, t);
        return pt ? <circle key={i} cx={pt.x} cy={pt.y} r={r} fill={farbe} /> : null;
      })}
    </>
  );
};

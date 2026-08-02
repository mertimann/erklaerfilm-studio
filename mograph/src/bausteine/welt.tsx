/**
 * WELT — die Bildwelt. Das, was dem letzten Versuch komplett gefehlt hat.
 *
 * Die Diagnose war eindeutig: In echten Erklärvideos ist jedes Bild eine
 * ILLUSTRIERTE SZENE — Figur, Gegenstände, Umgebung, Vorder- und Hintergrund.
 * Bei mir stand Text auf einem Raster. Eine Zahl in Helvetica ist kein Motiv.
 *
 * Hier stehen deshalb die Dinge, um die es inhaltlich geht: ein Haus im
 * Schnitt, ein Ölkessel im Keller, Heizkörper, eine Wärmepumpe an der Wand,
 * ein Techniker, ein Transporter, Bäume, Himmel. Alles als SVG-Geometrie mit
 * Parametern — damit sich Türen öffnen, Kessel qualmen, Rotoren drehen und
 * Figuren die Arme heben können.
 *
 * Zeichenkonvention: Alle Bauteile leben im Koordinatensystem 0..1920 x
 * 0..1080, damit sie sich ohne Umrechnung in jede Szene setzen lassen.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "./basis";

/** Farbwelt der Illustration - eigene Töne, damit es nicht nach UI aussieht. */
export const I = {
  himmelOben: "#16243F",
  himmelUnten: "#2C3F63",
  himmelWarmOben: "#2A2140",
  himmelWarmUnten: "#7A4A52",
  boden: "#1B2A45",
  bodenHell: "#243A5E",
  wand: "#E8E3D8",
  wandSchatten: "#CFC7B7",
  dach: "#3A4A6B",
  dachHell: "#4A5C82",
  fenster: "#7FD4E8",
  fensterWarm: "#FFCF7A",
  holz: "#8A5A3B",
  metall: "#98A6C4",
  metallDunkel: "#6B7899",
  rost: "#B4643A",
  laub: "#2E7D5B",
  laubHell: "#3FA372",
  stamm: "#4A3628",
} as const;

// ------------------------------------------------------------------ Himmel
export const Himmel: React.FC<{ warm?: boolean; kinder?: React.ReactNode }> = ({ warm, kinder }) => {
  const frame = useCurrentFrame();
  const o = warm ? I.himmelWarmOben : I.himmelOben;
  const u = warm ? I.himmelWarmUnten : I.himmelUnten;
  return (
    <>
      <defs>
        <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={o} />
          <stop offset="100%" stopColor={u} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#himmel)" />
      {/* Sterne / Lichtpunkte, die ganz langsam wandern */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = ((i * 271) % 1900) + 10;
        const y = 40 + ((i * 137) % 380);
        const fl = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / 22 + i));
        return <circle key={i} cx={x + Math.sin(frame / 300 + i) * 6} cy={y} r={2.4} fill="#FFF" opacity={fl * 0.5} />;
      })}
      {kinder}
    </>
  );
};

/** Hügelketten im Hintergrund - geben Tiefe ohne Aufwand. */
export const Huegel: React.FC<{ y?: number }> = ({ y = 720 }) => {
  const frame = useCurrentFrame();
  const d = (v: number, amp: number) =>
    `M -100 1080 L -100 ${y + v} ` +
    Array.from({ length: 13 })
      .map((_, i) => {
        const x = -100 + i * 180;
        const h = y + v - Math.abs(noise2D("h" + v, i * 0.6, 0)) * amp;
        return `L ${x} ${h.toFixed(0)}`;
      })
      .join(" ") +
    ` L 2020 ${y + v} L 2020 1080 Z`;
  return (
    <>
      <g transform={`translate(${(Math.sin(frame / 400) * 8).toFixed(1)} 0)`}>
        <path d={d(0, 150)} fill="#1E2C4A" />
      </g>
      <g transform={`translate(${(Math.sin(frame / 300) * 14).toFixed(1)} 0)`}>
        <path d={d(70, 90)} fill="#22314F" />
      </g>
    </>
  );
};

export const Baum: React.FC<{ x: number; y: number; s?: number; wind?: number }> = ({
  x,
  y,
  s = 1,
  wind = 1,
}) => {
  const frame = useCurrentFrame();
  const w = Math.sin(frame / 34 + x) * 2.2 * wind;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-9} y={-70} width={18} height={80} rx={5} fill={I.stamm} />
      <g transform={`rotate(${w.toFixed(2)} 0 -60)`}>
        <ellipse cy={-120} rx={64} ry={72} fill={I.laub} />
        <ellipse cx={-30} cy={-96} rx={44} ry={46} fill={I.laubHell} opacity={0.55} />
      </g>
    </g>
  );
};

// -------------------------------------------------------------------- Haus
/**
 * Das Haus im Schnitt. `oeffnung` blendet die Vorderwand aus, sodass man in
 * den Keller sieht - der Standard-Move in Erklärvideos, wenn es um Heizung
 * geht: erst das Haus, dann rein ins Haus.
 */
export const Haus: React.FC<{
  x?: number;
  y?: number;
  s?: number;
  oeffnung?: number;
  fensterWarm?: number;
  kinder?: React.ReactNode;
}> = ({ x = 0, y = 0, s = 1, oeffnung = 0, fensterWarm = 0, kinder }) => {
  const frame = useCurrentFrame();
  const fensterFarbe = fensterWarm > 0.5 ? I.fensterWarm : I.fenster;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* Grundkoerper */}
      <rect x={-260} y={-330} width={520} height={330} fill={I.wand} />
      <rect x={-260} y={-330} width={70} height={330} fill={I.wandSchatten} opacity={0.5} />
      {/* Dach */}
      <path d="M -300 -330 L 0 -510 L 300 -330 Z" fill={I.dach} />
      <path d="M -300 -330 L 0 -510 L 0 -330 Z" fill={I.dachHell} />
      {/* Schornstein */}
      <rect x={130} y={-478} width={54} height={100} fill={I.dachHell} />

      {/* Keller - nur sichtbar, wenn geoeffnet */}
      <g opacity={oeffnung}>
        <rect x={-260} y={0} width={520} height={190} fill="#101A2E" />
        <rect x={-260} y={0} width={520} height={12} fill={I.wandSchatten} />
      </g>

      {/* Vorderwand faehrt weg */}
      <g
        opacity={1 - oeffnung}
        transform={`translate(0 ${(-oeffnung * 120).toFixed(1)})`}
      >
        <rect x={-190} y={-250} width={110} height={110} rx={8} fill={fensterFarbe} opacity={0.9} />
        <rect x={80} y={-250} width={110} height={110} rx={8} fill={fensterFarbe} opacity={0.9} />
        <rect x={-56} y={-140} width={112} height={140} rx={8} fill={I.holz} />
        <circle cx={30} cy={-70} r={7} fill={I.metall} />
      </g>

      {kinder}
    </g>
  );
};

/** Ölkessel im Keller - qualmt, brummt, kostet Geld. */
export const Oelkessel: React.FC<{ x: number; y: number; s?: number; qualm?: number }> = ({
  x,
  y,
  s = 1,
  qualm = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-70} y={-150} width={140} height={150} rx={10} fill={I.metallDunkel} />
      <rect x={-70} y={-150} width={40} height={150} rx={10} fill={I.metall} opacity={0.4} />
      <rect x={-46} y={-118} width={92} height={54} rx={6} fill={I.rost} />
      <circle cx={0} cy={-40} r={17} fill={I.rost} />
      <rect x={-16} y={-176} width={32} height={30} fill={I.metallDunkel} />
      {/* Qualm */}
      {Array.from({ length: 6 }).map((_, i) => {
        const t = ((frame * 1.6 + i * 26) % 150) / 150;
        return (
          <circle
            key={i}
            cx={Math.sin(t * 6 + i) * 22}
            cy={-186 - t * 150}
            r={10 + t * 26}
            fill="#6B7899"
            opacity={(1 - t) * 0.4 * qualm}
          />
        );
      })}
    </g>
  );
};

/** Wärmepumpe an der Außenwand - Rotor dreht, Wellen gehen ab. */
export const Waermepumpe: React.FC<{ x: number; y: number; s?: number; an?: number }> = ({
  x,
  y,
  s = 1,
  an = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-96} y={-76} width={192} height={152} rx={16} fill="#F2F4F8" />
      <rect x={-96} y={-76} width={192} height={30} rx={16} fill="#DCE3EE" />
      <circle cx={0} cy={10} r={54} fill="#CBD5E6" />
      <g transform={`rotate(${(frame * 6 * an).toFixed(1)} 0 10)`}>
        {[0, 120, 240].map((a) => (
          <ellipse key={a} cx={0} cy={10} rx={48} ry={15} fill="#8FA0BC" transform={`rotate(${a} 0 10)`} />
        ))}
      </g>
      <circle cx={0} cy={10} r={11} fill={C.waerme} />
      {/* Waermewellen */}
      {[0, 1, 2].map((i) => {
        const t = ((frame * 1.4 + i * 22) % 66) / 66;
        return (
          <path
            key={i}
            d={`M 110 ${-30 + i * 30} q 30 -14 60 0`}
            fill="none"
            stroke={C.waerme}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={(1 - t) * 0.85 * an}
            transform={`translate(${t * 44} 0)`}
          />
        );
      })}
    </g>
  );
};

export const Heizkoerper: React.FC<{ x: number; y: number; s?: number; warm?: number }> = ({
  x,
  y,
  s = 1,
  warm = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: 6 }).map((_, i) => (
      <rect
        key={i}
        x={-58 + i * 20}
        y={-56}
        width={14}
        height={112}
        rx={6}
        fill={warm > 0.5 ? C.waerme : I.metall}
        opacity={warm > 0.5 ? 0.55 + 0.45 * warm : 0.9}
      />
    ))}
    <rect x={-62} y={-62} width={124} height={10} rx={5} fill={I.metallDunkel} />
    <rect x={-62} y={52} width={124} height={10} rx={5} fill={I.metallDunkel} />
  </g>
);

/** Techniker - schlichtes Rig, damit er den Arm heben kann. */
export const Techniker: React.FC<{
  x: number;
  y: number;
  s?: number;
  arm?: number;
  kopf?: number;
}> = ({ x, y, s = 1, arm = 0, kopf = 0 }) => {
  const frame = useCurrentFrame();
  const atem = Math.sin(frame / 40) * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(0 ${atem.toFixed(2)})`}>
      <rect x={-34} y={-120} width={68} height={130} rx={22} fill={C.waerme} />
      <rect x={-34} y={-120} width={22} height={130} rx={16} fill={C.waermeDunkel} opacity={0.5} />
      <rect x={4} y={10} width={22} height={86} rx={10} fill="#243A5E" />
      <rect x={-26} y={10} width={22} height={86} rx={10} fill="#2B3A57" />
      {/* Arme: hinterer fest, vorderer beweglich */}
      <g transform={`rotate(${(14).toFixed(1)} -30 -100)`}>
        <rect x={-44} y={-104} width={20} height={92} rx={10} fill={C.waermeDunkel} />
      </g>
      <g transform={`rotate(${(-arm * 120).toFixed(1)} 30 -100)`}>
        <rect x={22} y={-104} width={20} height={92} rx={10} fill={C.waerme} />
        <circle cx={32} cy={-8} r={13} fill={I.wand} />
      </g>
      <g transform={`rotate(${kopf.toFixed(1)} 0 -128)`}>
        <circle cx={0} cy={-150} r={38} fill={I.wand} />
        <path d="M -40 -164 q 40 -34 80 0 l 0 -10 q -40 -32 -80 0 z" fill={C.waermeDunkel} />
        <circle cx={-13} cy={-152} r={4.6} fill="#20293F" />
        <circle cx={13} cy={-152} r={4.6} fill="#20293F" />
      </g>
    </g>
  );
};

// =============================================================== Innenräume
/**
 * Die Räume, die dem letzten Versuch gefehlt haben. Neun Szenen vor derselben
 * Hausfassade sind kein Film - echte Erklärvideos wechseln Ort und Einstellung
 * ständig: Totale, Makro, Innenraum, abstrakter Raum.
 */

/** Wohnzimmer: Wand, Fenster mit Abendlicht, Boden, Sofa, Heizkörper. */
export const Wohnzimmer: React.FC<{ warm?: number }> = ({ warm = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <rect width={1920} height={1080} fill="#2A2438" />
      <rect x={0} y={0} width={1920} height={790} fill="#332B44" />
      {/* Fenster mit Abendhimmel */}
      <rect x={1180} y={140} width={520} height={430} rx={10} fill="#5E4560" />
      <rect x={1180} y={140} width={520} height={430} rx={10} fill="url(#himmel)" opacity={0.75} />
      <rect x={1424} y={140} width={22} height={430} fill="#332B44" />
      <rect x={1180} y={344} width={520} height={20} fill="#332B44" />
      <rect x={1150} y={570} width={580} height={26} rx={8} fill="#3E3450" />
      {/* Boden */}
      <rect x={0} y={790} width={1920} height={290} fill="#241E30" />
      <rect x={0} y={790} width={1920} height={10} fill="#4A3E5E" />
      {/* Teppich */}
      <ellipse cx={860} cy={950} rx={620} ry={110} fill="#3A2F4C" />
      {/* Sofa */}
      <g transform="translate(600 790)">
        <rect x={-330} y={-190} width={660} height={190} rx={26} fill="#7A4A52" />
        <rect x={-330} y={-260} width={660} height={90} rx={26} fill="#8E5A62" />
        <rect x={-360} y={-230} width={70} height={220} rx={22} fill="#6B4048" />
        <rect x={290} y={-230} width={70} height={220} rx={22} fill="#6B4048" />
      </g>
      {/* Stehlampe mit Lichtkegel */}
      <g transform="translate(1080 790)">
        <rect x={-6} y={-300} width={12} height={300} fill="#4A3E5E" />
        <path d="M -70 -390 L 70 -390 L 48 -300 L -48 -300 Z" fill="#F7C96E" opacity={0.9} />
        <path d="M -150 -300 L 150 -300 L 240 0 L -240 0 Z" fill="#F7C96E" opacity={0.1 * warm} />
      </g>
    </>
  );
};

/** Keller: Betonwände, Rohre, Bodenablauf. Kalt und funktional. */
export const Keller: React.FC = () => (
  <>
    <rect width={1920} height={1080} fill="#141C2C" />
    <rect x={0} y={0} width={1920} height={840} fill="#1C2637" />
    {/* Betonfugen */}
    {Array.from({ length: 5 }).map((_, i) => (
      <line key={i} x1={0} y1={140 + i * 150} x2={1920} y2={140 + i * 150} stroke="#263248" strokeWidth={3} />
    ))}
    {/* Rohre an der Decke */}
    {[70, 118].map((y, i) => (
      <g key={y}>
        <rect x={0} y={y} width={1920} height={26} rx={13} fill={i ? "#5A6A88" : "#6B7899"} />
        <rect x={520} y={y - 8} width={40} height={42} rx={8} fill="#46536E" />
        <rect x={1340} y={y - 8} width={40} height={42} rx={8} fill="#46536E" />
      </g>
    ))}
    {/* Kellerfenster */}
    <rect x={150} y={190} width={230} height={110} rx={6} fill="#3B4A66" />
    <rect x={150} y={190} width={230} height={110} rx={6} fill="#7FD4E8" opacity={0.28} />
    {/* Boden */}
    <rect x={0} y={840} width={1920} height={240} fill="#101825" />
    <rect x={0} y={840} width={1920} height={8} fill="#2B3A57" />
    <circle cx={1600} cy={980} r={34} fill="#0B1220" />
  </>
);

/** Küchentisch von nah: Tischplatte, darüber der Blick von schräg oben. */
export const Tisch: React.FC = () => (
  <>
    <rect width={1920} height={1080} fill="#2A2438" />
    <rect x={0} y={0} width={1920} height={340} fill="#332B44" />
    <rect x={0} y={340} width={1920} height={740} fill="#8A5A3B" />
    <rect x={0} y={340} width={1920} height={16} fill="#A06B47" />
    {/* Holzmaserung */}
    {Array.from({ length: 9 }).map((_, i) => (
      <line key={i} x1={0} y1={420 + i * 76} x2={1920} y2={432 + i * 76} stroke="#7A4E32" strokeWidth={5} opacity={0.6} />
    ))}
  </>
);

/** Abstrakter Raum: keine Umgebung, nur Tiefe. Für die Zahlenszene. */
export const Leere: React.FC<{ ton?: string }> = ({ ton = "#101A2E" }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <rect width={1920} height={1080} fill={ton} />
      {/* Perspektivische Bodenlinien, die nach hinten laufen */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = ((i * 80 + frame * 1.1) % 1120) / 1120;
        const y = 560 + t * t * 620;
        return <line key={i} x1={-200} y1={y} x2={2120} y2={y} stroke="#22314F" strokeWidth={2 + t * 4} opacity={0.2 + t * 0.5} />;
      })}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={i} x1={960 + (i - 6) * 40} y1={560} x2={960 + (i - 6) * 420} y2={1180} stroke="#22314F" strokeWidth={2} opacity={0.3} />
      ))}
    </>
  );
};

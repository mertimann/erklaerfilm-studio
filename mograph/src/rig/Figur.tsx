/**
 * FIGUR — eine parametrische Figur als SVG-Rig.
 *
 * Das ist die Antwort auf den Kernfehler des ersten Versuchs. Dort war die
 * kleinste animierbare Einheit ein ganzes PNG - ein Bild hat keine
 * Innenstruktur, es gibt keinen Oberarm, den man heben koennte. Hier ist jedes
 * Gelenk ein Prop, und jeder Frame kann eine andere Pose sein.
 *
 * ZWEI REGELN, an denen jedes selbstgebaute Rig sonst scheitert:
 *
 * 1. Gelenke drehen ueber das SVG-Attribut `transform="rotate(winkel cx cy)"`,
 *    NICHT ueber CSS `transform-origin`. Grund: der Anfangswert von
 *    `transform-box` ist `view-box` - `transform-origin: 50% 50%` meint dann
 *    die Mitte der viewBox, nicht die Mitte des Elements. Der Arm rotiert um
 *    die Bildmitte statt um die Schulter. `transform-box: fill-box` behebt das
 *    zwar, ist fuer Gelenke aber trotzdem falsch: es nimmt die Bounding Box,
 *    und die wandert mit, sobald ein Kind gestaucht wird.
 *
 * 2. Die Verschachtelung IST die Kinematik. Der Unterarm liegt im Oberarm,
 *    die Hand im Unterarm. Dreht die Schulter, wandert alles darunter mit -
 *    genau wie bei einem echten Rig. Alle Pivots stehen in T-Pose-Koordinaten,
 *    das Eltern-transform rechnet sie mit.
 *
 * Der Arm ist bewusst bis in die Schultermitte gezeichnet und dreht um diesen
 * Punkt. Dadurch entsteht beim Heben kein Loch - das klassische
 * Cutout-Prinzip, das ohne Inpainting auskommt.
 */
import React from "react";

export type Mund = "neutral" | "offen" | "laecheln";

export type Pose = {
  /** Schulter links/rechts in Grad. 0 = haengend. */
  schulterL?: number;
  schulterR?: number;
  /** Ellbogen, relativ zum Oberarm. */
  ellbogenL?: number;
  ellbogenR?: number;
  /** Kopfneigung. */
  kopf?: number;
  /** Augenbrauen hoch/runter in Pixeln. Negativ = hochgezogen (Ueberraschung). */
  brauen?: number;
  mund?: Mund;
  /** 0 = offen, 1 = geschlossen. */
  blinzeln?: number;
  /** Atmung: vertikaler Versatz des ganzen Koerpers. */
  atem?: number;
};

export type FigurFarben = {
  stoff: string;
  stoffDunkel: string;
  stoffHell: string;
  haar: string;
  haut: string;
  hautSchatten: string;
  akzent: string;
  akzentDunkel: string;
  hemd: string;
  stahl: string;
};

export const STANDARD_FARBEN: FigurFarben = {
  stoff: "#232F4E",
  stoffDunkel: "#1B253E",
  stoffHell: "#2E3D63",
  haar: "#141B2C",
  haut: "#F9B192",
  hautSchatten: "#E89A7C",
  akzent: "#F96313",
  akzentDunkel: "#D24A08",
  hemd: "#F2F4F8",
  stahl: "#8593BC",
};

const Arm: React.FC<{
  seite: "L" | "R";
  schulter: number;
  ellbogen: number;
  hinten: boolean;
  f: FigurFarben;
}> = ({ seite, schulter, ellbogen, hinten, f }) => {
  const x = seite === "L" ? 236 : 364;
  const c = hinten ? f.stoffDunkel : f.stoff;
  const cl = hinten ? f.stoffDunkel : f.stoffHell;
  return (
    // Schultergelenk. Der Drehpunkt steht explizit im Nutzerkoordinatensystem.
    <g transform={`rotate(${schulter.toFixed(3)} ${x} 272)`}>
      <path d={`M${x - 21} 268 q21 -10 42 0 l-3 84 q-18 8 -36 0 z`} fill={c} />
      <path d={`M${x - 21} 268 q10 -5 16 -4 l-2 88 l-11 -2 z`} fill={cl} opacity={0.55} />
      {/* Ellbogen - Kind der Schulter, also relativ zu ihr */}
      <g transform={`rotate(${ellbogen.toFixed(3)} ${x} 352)`}>
        <path d={`M${x - 18} 348 q18 -8 36 0 l-3 66 q-15 7 -30 0 z`} fill={c} />
        <rect x={x - 17} y={404} width={34} height={12} rx={5} fill={f.stahl} />
        <g transform={`translate(${x} 430)`}>
          <path
            d="M-17 -6 q0 -14 17 -14 q17 0 17 14 q0 24 -17 26 q-17 -2 -17 -26 z"
            fill={f.haut}
          />
          <path
            d="M-17 -2 q6 6 17 6 q11 0 17 -6 q0 22 -17 24 q-17 -2 -17 -24 z"
            fill={f.hautSchatten}
            opacity={0.45}
          />
        </g>
      </g>
    </g>
  );
};

const MUND: Record<Mund, (f: FigurFarben) => React.ReactNode> = {
  neutral: () => (
    <path d="M289 200 h22" stroke="#9C4030" strokeWidth={6} strokeLinecap="round" />
  ),
  offen: () => (
    <>
      <path d="M286 192 q14 -6 28 0 q-2 24 -14 24 q-12 0 -14 -24 z" fill="#8C3020" />
      <path d="M286 192 q14 -6 28 0 q-14 5 -28 0z" fill="#fff" />
    </>
  ),
  laecheln: () => <path d="M285 194 q15 16 30 0 q-15 8 -30 0z" fill="#8C3020" />,
};

export const Figur: React.FC<{
  pose: Pose;
  farben?: FigurFarben;
  /** Breite in Pixeln; das Rig ist intern 600x600. */
  breite?: number;
}> = ({ pose, farben = STANDARD_FARBEN, breite = 600 }) => {
  const f = farben;
  const {
    schulterL = 6,
    schulterR = -6,
    ellbogenL = 5,
    ellbogenR = -5,
    kopf = 0,
    brauen = 0,
    mund = "neutral",
    blinzeln = 0,
    atem = 0,
  } = pose;

  // Lidschlag als Hoehe der Pupille - 1 px heisst zu.
  const augenHoehe = 1 + (1 - Math.max(0, Math.min(1, blinzeln))) * 6;

  // Die viewBox ist auf den tatsaechlichen Koerper zugeschnitten, nicht auf die
  // 600x600-Zeichenflaeche. Sonst ist die Figur bei `breite={640}` nur etwa ein
  // Drittel so gross wie angegeben - der Rest ist leerer Rand.
  // Seitlich grosszuegig, weil ein erhobener Arm ueber den Torso hinausragt.
  return (
    <svg
      width={breite}
      height={(breite * 470) / 300}
      viewBox="150 30 300 470"
      style={{ overflow: "visible" }}
    >
      <g transform={`translate(0 ${atem.toFixed(2)})`}>
        <Arm seite="L" schulter={schulterL} ellbogen={ellbogenL} hinten f={f} />

        <g>
          <path d="M258 266 q42 -16 84 0 l16 214 q-58 16 -116 0 z" fill={f.stoff} />
          <path d="M258 266 q20 -8 34 -11 l-8 225 l-26 0 z" fill={f.stoffHell} opacity={0.5} />
          <path d="M284 258 q16 10 32 0 l-4 12 q-12 8 -24 0 z" fill={f.hemd} />
          <path d="M286 262 L300 306 L314 262 l10 6 l-24 52 l-24 -52 z" fill={f.hemd} />
          <rect x={288} y={300} width={26} height={8} rx={4} fill={f.stahl} />
        </g>

        <g transform={`rotate(${kopf.toFixed(3)} 300 252)`}>
          <path d="M290 226 h20 v28 q-10 6 -20 0 z" fill={f.hautSchatten} />
          <path d="M258 170 q0 -58 42 -58 q42 0 42 58 v30 q0 42 -42 42 q-42 0 -42 -42 z" fill={f.haut} />
          <path d="M258 176 q-2 -66 42 -66 q44 0 42 66 q-6 -26 -22 -32 q-24 12 -46 2 q-12 8 -16 30 z" fill={f.haar} />
          <path d="M254 168 q-8 40 4 62 q-14 -4 -12 -34 q1 -22 8 -28z" fill={f.haar} />
          <circle cx={300} cy={100} r={22} fill={f.haar} />
          <circle cx={300} cy={96} r={9} fill="#20293F" />
          <ellipse cx={282} cy={180} rx={6} ry={augenHoehe} fill={f.haar} />
          <ellipse cx={318} cy={180} rx={6} ry={augenHoehe} fill={f.haar} />
          <g transform={`translate(0 ${brauen.toFixed(2)})`}>
            <path d="M274 164 q8 -7 17 -2" stroke={f.haar} strokeWidth={5} fill="none" strokeLinecap="round" />
            <path d="M309 162 q9 -5 17 2" stroke={f.haar} strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
          <path d="M296 186 q5 8 0 12" stroke={f.hautSchatten} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          {MUND[mund](f)}
          <ellipse cx={270} cy={196} rx={7} ry={4} fill="#F08A6E" opacity={0.5} />
          <ellipse cx={330} cy={196} rx={7} ry={4} fill="#F08A6E" opacity={0.5} />
          <path d="M270 250 q30 18 60 0 l8 14 q-38 22 -76 0 z" fill={f.akzent} />
          <path d="M316 260 l16 -6 l10 22 l-18 2 z" fill={f.akzentDunkel} />
        </g>

        <Arm seite="R" schulter={schulterR} ellbogen={ellbogenR} hinten={false} f={f} />
      </g>
    </svg>
  );
};

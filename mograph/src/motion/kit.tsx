/**
 * KIT — Motion-Design-Bausteine auf Basis der offiziellen Remotion-Pakete.
 *
 * Die Vorgeschichte, damit sie nicht wiederkommt: Der erste Versuch hat fertige
 * PNG-Illustrationen als starre Bloecke verschoben und ihnen ein Dauerwackeln
 * (sin-Kurve) verpasst. Das ist der Grund, warum es lachhaft aussah.
 *
 * Zwei Saetze aus der Analyse, die alles erklaeren:
 *
 *   1. Die kleinste animierbare Einheit war das GANZE BILD. Ein PNG hat keine
 *      Innenstruktur - es gibt keinen Oberarm, den man heben koennte.
 *   2. Eine Dauerschwingung ohne Anlass ist das visuelle Signal fuer "hier
 *      wackelt eine Grafik". Echte Bewegung ist ein EREIGNIS: Anlass,
 *      Beschleunigung, Ziel, Nachschwingen.
 *
 * Deshalb arbeitet dieses Kit mit Geometrie statt mit Bildern: Pfade, die sich
 * zeichnen, Formen, die ineinander morphen, Zahlen, die zaehlen, Balken, die
 * wachsen. Das laesst sich rechnen, es traegt Bedeutung, und es ist ueber alle
 * Frames identisch reproduzierbar.
 */
import React, { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  evolvePath,
  getLength,
  getPointAtLength,
  getTangentAtLength,
  interpolatePath,
} from "@remotion/paths";
import { noise2D } from "@remotion/noise";

/** Die drei Kurven aus der offiziellen Remotion-Anleitung, woertlich uebernommen. */
export const KURVE = {
  /** starker Ease-Out ohne Overshoot - der Standard fuer Auftritte */
  auftritt: Easing.bezier(0.16, 1, 0.3, 1),
  /** symmetrisch, ruhig - fuer Kamerafahrten und lange Wege */
  ruhig: Easing.bezier(0.45, 0, 0.55, 1),
  /** schwingt ueber das Ziel hinaus - sparsam einsetzen */
  ueberschwung: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** Abgaenge: startet langsam, beschleunigt weg */
  abgang: Easing.bezier(0.333, 0, 0.667, 0),
} as const;

/**
 * Auf Zweien oder Dreien animieren.
 *
 * Das ist die groesste Einzelmassnahme gegen den Computer-Look und kostet eine
 * Zeile: echte Animation zeigt nicht 30 verschiedene Zwischenpositionen pro
 * Sekunde. `posterize: 2` heisst, jede zweite Position wird gehalten.
 */
export const AUF_ZWEIEN = { posterize: 2 } as const;
export const AUF_DREIEN = { posterize: 3 } as const;

type Zeit = { von: number; dauer: number };

/** Normierter Fortschritt 0..1 mit Kurve. Timing und Zuordnung sauber getrennt. */
export const fortschritt = (
  frame: number,
  { von, dauer }: Zeit,
  easing: (n: number) => number = KURVE.auftritt,
  posterize?: number,
) =>
  interpolate(frame, [von, von + dauer], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    ...(posterize ? { posterize } : {}),
  });

// ------------------------------------------------------- Pfad, der sich zeichnet
/**
 * Ein Pfad zeichnet sich, und ein Objekt reist darauf mit - ausgerichtet in
 * Fahrtrichtung. Das ist das Muster, mit dem GitHub Unwrapped ohne eine einzige
 * animierte Figur lebendig wirkt.
 *
 * Warum das mehr ist als "Objekt von A nach B": Der gebogene Pfad erzeugt
 * Arcs, Antizipation und Wegfuehrung als Nebenprodukt der Geometrie. Eine
 * gerade Translation kann das nicht.
 */
export const Pfadreise: React.FC<{
  d: string;
  zeit: Zeit;
  farbe: string;
  breite?: number;
  reisender?: React.ReactNode;
  /** Der Pfad kann stehen bleiben, nachdem der Reisende durch ist. */
  pfadBleibt?: boolean;
}> = ({ d, zeit, farbe, breite = 8, reisender, pfadBleibt = true }) => {
  const frame = useCurrentFrame();
  const p = fortschritt(frame, zeit, KURVE.auftritt);
  const laenge = useMemo(() => getLength(d), [d]);
  const { strokeDasharray, strokeDashoffset } = useMemo(() => evolvePath(p, d), [p, d]);

  // Ab Remotion 5 geben diese Funktionen bei Ueberlaenge null zurueck statt des
  // Endpunkts - deshalb klemmen und den Nullfall abfangen.
  const bei = Math.max(0, Math.min(p * laenge, laenge - 0.01));
  const punkt = getPointAtLength(d, bei);
  const tang = getTangentAtLength(d, bei);
  const winkel = tang ? (Math.atan2(tang.y, tang.x) * 180) / Math.PI : 0;

  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={farbe}
        strokeWidth={breite}
        strokeLinecap="round"
        strokeDasharray={pfadBleibt ? strokeDasharray : undefined}
        strokeDashoffset={pfadBleibt ? strokeDashoffset : undefined}
        opacity={pfadBleibt ? 1 : 0}
      />
      {reisender && punkt && p > 0.001 && p < 0.999 ? (
        <g transform={`translate(${punkt.x} ${punkt.y}) rotate(${winkel})`}>{reisender}</g>
      ) : null}
    </>
  );
};

/**
 * Ein gebogener Pfad, prozedural aus Rauschen erzeugt.
 *
 * Die Glockengewichtung sorgt dafuer, dass der Weg in der Mitte ausschlaegt und
 * an den Enden ruhig ankommt - sonst wirkt der Bogen zufaellig statt gefuehrt.
 * `noise2D` ist geseedet und damit ueber alle Frames und alle Render identisch.
 */
export const bogenPfad = (
  von: readonly [number, number],
  nach: readonly [number, number],
  seed: string,
  staerke = 160,
  punkte = 60,
) => {
  const [x0, y0] = von;
  const [x1, y1] = nach;
  const dx = x1 - x0,
    dy = y1 - y0;
  const laenge = Math.hypot(dx, dy) || 1;
  const nx = -dy / laenge,
    ny = dx / laenge; // Normale zur Verbindungslinie

  let d = "";
  for (let i = 0; i <= punkte; i++) {
    const t = i / punkte;
    const glocke = Math.sin(t * Math.PI); // 0 an den Enden, 1 in der Mitte
    const ab = noise2D(seed, t * 2.5, 0) * staerke * glocke;
    const x = x0 + dx * t + nx * ab;
    const y = y0 + dy * t + ny * ab;
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
};

// ------------------------------------------------------------------ Morphing
/**
 * Eine Form wird zu einer anderen. Nicht "Form A blendet aus, Form B blendet
 * ein" - die Kanten wandern tatsaechlich.
 *
 * Grenze, die man kennen muss: interpolatePath gleicht die Punktzahl an, indem
 * es am Pfadende dupliziert. Bei strukturell verwandten Formen ist das perfekt,
 * bei zwei voellig fremden Icons bekommt man Verdrehungen.
 */
export const Morph: React.FC<{
  von: string;
  nach: string;
  zeit: Zeit;
  fill: string;
}> = ({ von, nach, zeit, fill }) => {
  const frame = useCurrentFrame();
  const t = fortschritt(frame, zeit, KURVE.ruhig, 2);
  return <path d={interpolatePath(t, von, nach)} fill={fill} />;
};

// ------------------------------------------------------------------ Zaehlen
/**
 * Eine Zahl zaehlt hoch. Klingt banal, ist aber der Unterschied zwischen
 * "hier steht 40" und "es werden 40" - die Bewegung IST die Aussage.
 * Bewusst auf Zweien, damit die Ziffern nicht flimmern.
 */
export const Zaehler: React.FC<{
  bis: number;
  zeit: Zeit;
  stil?: React.CSSProperties;
  suffix?: string;
}> = ({ bis, zeit, stil, suffix = "" }) => {
  const frame = useCurrentFrame();
  const wert = interpolate(frame, [zeit.von, zeit.von + zeit.dauer], [0, bis], {
    easing: KURVE.auftritt,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    posterize: 2,
  });
  return (
    <div style={stil}>
      {Math.round(wert)}
      {suffix}
    </div>
  );
};

// ----------------------------------------------------------- Nachschwingen
/**
 * Ersatz fuer das alte Dauerwackeln.
 *
 * Der Unterschied: das hier laeuft NICHT dauernd. Es wird durch ein Ereignis
 * ausgeloest und schwingt gedaempft aus. Jedes Glied einer Kette hinkt dem
 * vorigen nach (`versatzProGlied`) und schwingt schwaecher (`abfall`) - daraus
 * entsteht Follow-Through und Overlapping Action von selbst.
 */
export const nachschwingen = (
  frame: number,
  ausloeser: number,
  glied = 0,
  { versatzProGlied = 2.5, abfall = 0.68, amplitude = 1, dauer = 26 } = {},
) => {
  const t = frame - ausloeser - glied * versatzProGlied;
  if (t <= 0) return 0;
  if (t >= dauer) return 0;
  // gedaempfte Schwingung: schnell rein, dann austrudeln
  const huelle = Math.exp(-t / (dauer * 0.32));
  return Math.sin((t / dauer) * Math.PI * 3) * huelle * amplitude * Math.pow(abfall, glied);
};

// ------------------------------------------------------------- Wortaufbau
/** Text erscheint Wort fuer Wort, versetzt. Nie zeichenweise per Opacity. */
export const Wortaufbau: React.FC<{
  text: string;
  zeit: Zeit;
  proWort?: number;
  stil?: React.CSSProperties;
}> = ({ text, zeit, proWort = 3, stil }) => {
  const frame = useCurrentFrame();
  const worte = text.split(" ");
  return (
    <div style={{ ...stil, display: "flex", flexWrap: "wrap", gap: "0 0.28em" }}>
      {worte.map((w, i) => {
        const p = fortschritt(frame, { von: zeit.von + i * proWort, dauer: zeit.dauer }, KURVE.auftritt);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              translate: `0px ${((1 - p) * 26).toFixed(2)}px`,
              opacity: p,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------- Balken
/** Balken wachsen aus der Grundlinie, versetzt, mit leichtem Ueberschwung. */
export const Balken: React.FC<{
  werte: number[];
  zeit: Zeit;
  farbe: (i: number) => string;
  breite: number;
  hoehe: number;
  x: number;
  y: number;
}> = ({ werte, zeit, farbe, breite, hoehe, x, y }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...werte, 1);
  const spalte = breite / werte.length;
  return (
    <>
      {werte.map((v, i) => {
        const p = fortschritt(
          frame,
          { von: zeit.von + i * 3, dauer: zeit.dauer },
          KURVE.ueberschwung,
          2,
        );
        const h = (v / max) * hoehe * p;
        return (
          <rect
            key={i}
            x={x + i * spalte + spalte * 0.14}
            y={y + hoehe - h}
            width={spalte * 0.72}
            height={Math.max(0, h)}
            rx={spalte * 0.12}
            fill={farbe(i)}
          />
        );
      })}
    </>
  );
};

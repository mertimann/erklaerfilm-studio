/**
 * LIB — die Bausteine. Jeder einzelne ist eine BEWEGUNG, kein Objekt.
 *
 * Der Fehler der Vorversionen: Elemente wurden platziert und dann bewegt. Hier
 * ist es umgekehrt - jeder Baustein IST ein Vorgang mit Anfang und Ende:
 * eine Zahl, die zählt. Ein Haken, der gezeichnet wird. Ein Balken, der wächst.
 * Ein Stapel, der sich aufbaut. Nichts davon existiert, bevor es passiert.
 *
 * Alles läuft über `interpolate()` mit expliziten Bezier-Kurven, wie es die
 * offizielle Remotion-Anleitung vorgibt. Kein CSS-Transition, keine
 * CSS-Animation - die rendern nachweislich nicht korrekt.
 */
import React, { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { noise2D } from "@remotion/noise";
import { C, E, SCHRIFT } from "./basis";

type Kurve = readonly [number, number, number, number];

/** Fortschritt 0..1 über ein Frame-Fenster. Timing und Zuordnung getrennt. */
export const p = (
  frame: number,
  von: number,
  dauer: number,
  kurve: Kurve = E.auftritt,
  posterize?: number,
) =>
  interpolate(frame, [von, von + dauer], [0, 1], {
    easing: Easing.bezier(kurve[0], kurve[1], kurve[2], kurve[3]),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    ...(posterize ? { posterize } : {}),
  });

/** Auftritt und Abgang in einem Wert: steigt an, hält, fällt ab. */
export const pulsBand = (
  frame: number,
  von: number,
  dauerRein: number,
  halten: number,
  dauerRaus: number,
) => p(frame, von, dauerRein) - p(frame, von + dauerRein + halten, dauerRaus, E.abgang);

/** Gedämpftes Nachschwingen nach einem Ereignis. Läuft aus und hört auf. */
export const schwingt = (frame: number, ausloeser: number, amp = 1, dauer = 22) => {
  const t = frame - ausloeser;
  if (t <= 0 || t >= dauer) return 0;
  return Math.sin((t / dauer) * Math.PI * 3) * Math.exp(-t / (dauer * 0.3)) * amp;
};

// --------------------------------------------------------------- Hintergrund
/**
 * Der Hintergrund ist nie eine tote Fläche. Ein Raster driftet langsam, dazu
 * ein weicher Lichtkegel, dessen Mitte wandert. Das allein sorgt dafür, dass
 * kein Frame dem vorigen gleicht.
 */
export const Raster: React.FC<{ ton?: string; dicht?: number; deckung?: number }> = ({
  ton = C.linie,
  dicht = 96,
  deckung = 1,
}) => {
  const frame = useCurrentFrame();
  const dx = (frame * 0.32) % dicht;
  const dy = (frame * 0.19) % dicht;
  return (
    <div
      style={{
        position: "absolute",
        inset: -dicht,
        opacity: deckung,
        backgroundImage: `linear-gradient(${ton} 1px, transparent 1px), linear-gradient(90deg, ${ton} 1px, transparent 1px)`,
        backgroundSize: `${dicht}px ${dicht}px`,
        backgroundPosition: `${dx}px ${dy}px`,
      }}
    />
  );
};

export const Lichtkegel: React.FC<{ farbe?: string; staerke?: number }> = ({
  farbe = C.waerme,
  staerke = 0.34,
}) => {
  const frame = useCurrentFrame();
  const x = 50 + noise2D("kegel", frame / 190, 0) * 22;
  const y = 44 + noise2D("kegel", 0, frame / 220) * 16;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(58% 62% at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${farbe}${Math.round(
          staerke * 255,
        )
          .toString(16)
          .padStart(2, "0")} 0%, transparent 68%)`,
      }}
    />
  );
};

/** Langsame Kamerafahrt über die ganze Szene. Nur Zoom UND Versatz zusammen. */
export const kamera = (frame: number, dauer: number, richtung = 0, weite = 0.035) => {
  const q = Math.min(1, frame / Math.max(1, dauer));
  const w = (richtung * Math.PI * 2) / 3 + 0.6;
  return {
    scale: 1 + weite * q,
    translate: `${(Math.cos(w) * 14 * q).toFixed(2)}px ${(Math.sin(w) * 9 * q).toFixed(2)}px`,
  };
};

// ------------------------------------------------------------------- Zahlen
/**
 * Eine Zahl, die zählt. Mit deutschem Tausenderpunkt, weil eine Zahl wie
 * 35000 auf der Leinwand nicht lesbar ist.
 */
export const Zahl: React.FC<{
  bis: number;
  von?: number;
  start: number;
  dauer: number;
  stil?: React.CSSProperties;
  suffix?: string;
  praefix?: string;
  nachkomma?: number;
}> = ({ bis, von = 0, start, dauer, stil, suffix = "", praefix = "", nachkomma = 0 }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [start, start + dauer], [von, bis], {
    easing: Easing.bezier(...(E.auftritt as unknown as [number, number, number, number])),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    posterize: 2,
  });
  return (
    <span style={{ fontFamily: SCHRIFT, fontVariantNumeric: "tabular-nums", ...stil }}>
      {praefix}
      {w.toLocaleString("de-DE", {
        minimumFractionDigits: nachkomma,
        maximumFractionDigits: nachkomma,
      })}
      {suffix}
    </span>
  );
};

// ------------------------------------------------------------------- Text
/** Text baut sich Wort für Wort auf, versetzt. Nie zeichenweise per Opacity. */
export const Worte: React.FC<{
  text: string;
  start: number;
  proWort?: number;
  stil?: React.CSSProperties;
  aus?: number;
}> = ({ text, start, proWort = 3, stil, aus }) => {
  const frame = useCurrentFrame();
  const raus = aus === undefined ? 1 : 1 - p(frame, aus, 8, E.abgang);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 0.3em", fontFamily: SCHRIFT, ...stil }}>
      {text.split(" ").map((w, i) => {
        const q = p(frame, start + i * proWort, 11);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              translate: `0px ${((1 - q) * 30).toFixed(2)}px`,
              opacity: q * raus,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Eine Zeile wird von einem farbigen Balken aufgedeckt, der weiterzieht. */
export const Aufdecken: React.FC<{
  start: number;
  dauer?: number;
  farbe?: string;
  children: React.ReactNode;
  stil?: React.CSSProperties;
}> = ({ start, dauer = 14, farbe = C.waerme, children, stil }) => {
  const frame = useCurrentFrame();
  const q = p(frame, start, dauer, E.snap);
  const r = p(frame, start + 5, dauer, E.snap);
  return (
    <div style={{ position: "relative", display: "inline-block", ...stil }}>
      <div style={{ clipPath: `inset(0 ${((1 - r) * 100).toFixed(1)}% 0 0)` }}>{children}</div>
      <div
        style={{
          position: "absolute",
          top: "-6%",
          bottom: "-6%",
          left: `${(r * 100).toFixed(1)}%`,
          width: `${Math.max(0, (q - r) * 100).toFixed(1)}%`,
          backgroundColor: farbe,
        }}
      />
    </div>
  );
};

// ------------------------------------------------------------------ Formen
/** Ein Haken, der gezeichnet wird - nicht einer, der erscheint. */
export const Haken: React.FC<{ start: number; groesse?: number; farbe?: string; dauer?: number }> = ({
  start,
  groesse = 54,
  farbe = C.gruen,
  dauer = 12,
}) => {
  const frame = useCurrentFrame();
  const d = "M 10 27 L 22 39 L 45 13";
  const q = p(frame, start, dauer, E.snap);
  const ev = evolvePath(q, d);
  const ring = p(frame, start - 4, 12, E.ueber);
  return (
    <svg width={groesse} height={groesse} viewBox="0 0 54 54" style={{ overflow: "visible" }}>
      <circle cx={27} cy={27} r={25 * ring} fill="none" stroke={farbe} strokeWidth={3} opacity={0.45} />
      <path
        d={d}
        fill="none"
        stroke={farbe}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={ev.strokeDasharray}
        strokeDashoffset={ev.strokeDashoffset}
      />
    </svg>
  );
};

/** Ein Balken, der aus der Grundlinie wächst, mit Zahl obendrauf. */
export const Balken: React.FC<{
  start: number;
  hoehe: number;
  breite: number;
  farbe: string;
  label: string;
  wert: number;
  suffix?: string;
  x: number;
  boden: number;
  dauer?: number;
}> = ({ start, hoehe, breite, farbe, label, wert, suffix = "", x, boden, dauer = 20 }) => {
  const frame = useCurrentFrame();
  const q = p(frame, start, dauer, E.ueber, 2);
  const h = hoehe * q;
  const beschriftung = p(frame, start + 10, 10);
  return (
    <>
      <rect x={x} y={boden - h} width={breite} height={h} rx={10} fill={farbe} />
      <g opacity={beschriftung} transform={`translate(0 ${(1 - beschriftung) * 12})`}>
        <text
          x={x + breite / 2}
          y={boden - h - 24}
          textAnchor="middle"
          fill={farbe}
          fontFamily={SCHRIFT}
          fontSize={44}
          fontWeight={900}
        >
          {Math.round(wert * q).toLocaleString("de-DE")}
          {suffix}
        </text>
      </g>
      <text
        x={x + breite / 2}
        y={boden + 44}
        textAnchor="middle"
        fill={C.gedaempft}
        fontFamily={SCHRIFT}
        fontSize={30}
        fontWeight={700}
        opacity={p(frame, start, 10)}
      >
        {label}
      </text>
    </>
  );
};

/** Ein Pfad, der sich zeichnet, optional mit einem Objekt, das mitreist. */
export const Zeichnet: React.FC<{
  d: string;
  start: number;
  dauer: number;
  farbe: string;
  breite?: number;
  kopf?: React.ReactNode;
  gestrichelt?: boolean;
}> = ({ d, start, dauer, farbe, breite = 8, kopf, gestrichelt }) => {
  const frame = useCurrentFrame();
  const q = p(frame, start, dauer, E.ruhig);
  const laenge = useMemo(() => getLength(d), [d]);
  const ev = useMemo(() => evolvePath(q, d), [q, d]);
  const pt = getPointAtLength(d, Math.max(0, Math.min(q * laenge, laenge - 0.01)));
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={farbe}
        strokeWidth={breite}
        strokeLinecap="round"
        strokeDasharray={gestrichelt ? "14 18" : ev.strokeDasharray}
        strokeDashoffset={gestrichelt ? -frame * 1.2 : ev.strokeDashoffset}
        opacity={gestrichelt ? q : 1}
      />
      {kopf && pt && q > 0.01 ? <g transform={`translate(${pt.x} ${pt.y})`}>{kopf}</g> : null}
    </>
  );
};

/** Münzstapel, der sich Stück für Stück aufbaut. */
export const Stapel: React.FC<{
  start: number;
  anzahl: number;
  x: number;
  boden: number;
  breite?: number;
  farbe?: string;
  proStueck?: number;
}> = ({ start, anzahl, x, boden, breite = 96, farbe = C.sand, proStueck = 2 }) => {
  const frame = useCurrentFrame();
  const hoehe = 15;
  return (
    <>
      {Array.from({ length: anzahl }).map((_, i) => {
        const q = p(frame, start + i * proStueck, 12, E.ueber);
        const y = boden - i * hoehe;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y - (1 - q) * 150}
            rx={(breite / 2) * q}
            ry={(breite / 2) * 0.3 * q}
            fill={i % 2 ? farbe : C.waermeHell}
            opacity={q}
          />
        );
      })}
    </>
  );
};

/** Karte, die hereinfährt - Grundelement für Vergleiche. */
export const Karte: React.FC<{
  start: number;
  x: number;
  y: number;
  b: number;
  h: number;
  farbe?: string;
  rand?: string;
  von?: "links" | "rechts" | "unten";
  kinder?: React.ReactNode;
  raus?: number;
}> = ({ start, x, y, b, h, farbe = C.flaeche, rand = C.linie, von = "unten", kinder, raus }) => {
  const frame = useCurrentFrame();
  const q = p(frame, start, 16, E.auftritt);
  const weg = 150 * (1 - q);
  const ab = raus === undefined ? 0 : p(frame, raus, 12, E.abgang);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: b,
        height: h,
        backgroundColor: farbe,
        border: `2px solid ${rand}`,
        borderRadius: 26,
        opacity: q * (1 - ab),
        translate: `${von === "links" ? -weg : von === "rechts" ? weg : 0}px ${
          von === "unten" ? weg + ab * 90 : ab * 90
        }px`,
        scale: 1 - ab * 0.12,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {kinder}
    </div>
  );
};

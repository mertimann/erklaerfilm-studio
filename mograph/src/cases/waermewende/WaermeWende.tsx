/**
 * WÄRMEWENDE — die Montage.
 *
 * Harte Schnitte statt Effektübergängen. Der Grund ist gemessen: Die eine
 * durchgehende Sprachaufnahme ist die Zeitachse, und jede Szene beginnt exakt
 * an ihrer Absatzgrenze. Überblendungen verkürzen die Zeitachse und schieben
 * den Ton aus dem Takt — Schnitte nicht. Die Bewegung übernehmen die Szenen
 * selbst: jede öffnet mit Motiv-Bewegung im ersten halben Dutzend Frames.
 *
 * Farbdramaturgie (der Grund, warum es keine Blauviolett-Wurst mehr ist):
 *   Problem   S01–S02  Nacht-Navy / dunkles Rot
 *   Lösung    S03      volles Orange (Kapitelwechsel)
 *   Schritte  S04–S06  helles Creme, navy Zeichnung
 *   Sicherheit S07–S08 dunkles Grün
 *   Abschluss S09      warmer Orangeverlauf
 */
import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { BEATS, f } from "./tokens";
import { S01 } from "./scenes/S01";
import { S02 } from "./scenes/S02";
import { S03 } from "./scenes/S03";
import { S04 } from "./scenes/S04";
import { S05 } from "./scenes/S05";
import { S06 } from "./scenes/S06";
import { S07 } from "./scenes/S07";
import { S08 } from "./scenes/S08";
import { S09 } from "./scenes/S09";

const SZENEN = [S01, S02, S03, S04, S05, S06, S07, S08, S09];
const IDS = ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09"] as const;

export const laenge = () => IDS.reduce((s, id) => s + f(BEATS[id]), 0);

export const WaermeWende: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {/* EINE durchgehende Aufnahme - eine Stimme, kein Drift */}
    <Audio src={staticFile("vo/waermewende.wav")} />
    <Series>
      {SZENEN.map((S, i) => (
        <Series.Sequence key={IDS[i]} durationInFrames={f(BEATS[IDS[i]])}>
          <S />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

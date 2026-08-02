/**
 * HANDLUNG — Posen aus Ereignissen, nicht aus einer Dauerschwingung.
 *
 * Der Unterschied zum alten `ruhe()`: Dort lief eine sin-Kurve durchgehend und
 * ohne Anlass - das visuelle Signal fuer "hier wackelt eine Grafik". Hier hat
 * jede Bewegung einen Ausloeser, ein Ziel und ein Nachschwingen.
 *
 * Atmung und Blinzeln laufen weiter, aber die sind auch im echten Leben ein
 * Dauerzustand - und sie sind so klein, dass man sie nicht als Effekt liest.
 * Alles andere ist ein Ereignis.
 *
 * Zahlen fuer 30 fps, Erklaervideo-Tempo (aus der Recherche):
 *   Antizipation      3-5 Frames, 8-15 % Gegenamplitude
 *   Hauptbewegung     12-20 Frames
 *   Ueberschwung      6-12 %, 4-6 Frames Einschwingen
 *   Versatz pro Glied 2-4 Frames
 *   Blinzeln          3-4 Frames zu, Intervall 90-210 Frames
 */
import { Easing, interpolate } from "remotion";
import type { Pose } from "./Figur";

const AUFTRITT = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Gedaempftes Nachschwingen nach einem Ereignis. Laeuft aus und hoert auf -
 * im Gegensatz zur alten Dauerschwingung.
 */
export const ausschwingen = (
  frame: number,
  ausloeser: number,
  { dauer = 24, amplitude = 1, glied = 0, versatz = 2.5, abfall = 0.68 } = {},
) => {
  const t = frame - ausloeser - glied * versatz;
  if (t <= 0 || t >= dauer) return 0;
  const huelle = Math.exp(-t / (dauer * 0.3));
  return Math.sin((t / dauer) * Math.PI * 3) * huelle * amplitude * Math.pow(abfall, glied);
};

/** Blinzeln: kurz, unregelmaessig, nie im Takt. */
export const blinzeln = (frame: number, seed = 0) => {
  const zyklus = 118 + ((seed * 37) % 60);
  const t = (frame + seed * 23) % zyklus;
  if (t > 3) return 0;
  return t === 0 || t === 3 ? 0.5 : 1;
};

/** Atmung: sehr klein, sonst wirkt es wie Wackeln. */
export const atmen = (frame: number, staerke = 1) =>
  Math.sin((frame / 74) * Math.PI * 2) * 2.2 * staerke;

export type HandlungsName = "ueberfordert" | "winken" | "zeigen" | "ruhig";

/**
 * Eine Handlung liefert die Pose fuer einen Frame. `start` ist der Frame, ab
 * dem die Handlung laeuft - davor steht die Figur in Ruhe.
 */
export const handlung = (
  name: HandlungsName,
  frame: number,
  start = 0,
  seed = 0,
): Pose => {
  const t = frame - start;
  const grund: Pose = {
    atem: atmen(frame),
    blinzeln: blinzeln(frame, seed),
    mund: "neutral",
  };

  if (name === "ruhig") return grund;

  if (name === "ueberfordert") {
    // Antizipation: Arme sacken erst leicht ab, dann hoch. Beide Arme
    // versetzt, damit es nicht symmetrisch und damit maschinell wirkt.
    const p = interpolate(t, [0, 16], [0, 1], {
      easing: AUFTRITT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const pR = interpolate(t, [3, 20], [0, 1], {
      easing: AUFTRITT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      ...grund,
      schulterL: 6 + p * 142 + ausschwingen(frame, start + 16, { amplitude: 7 }),
      ellbogenL: 5 + p * 18 + ausschwingen(frame, start + 16, { amplitude: 9, glied: 1 }),
      schulterR: -6 - pR * 142 - ausschwingen(frame, start + 20, { amplitude: 7 }),
      ellbogenR: -5 - pR * 18 - ausschwingen(frame, start + 20, { amplitude: 9, glied: 1 }),
      kopf: -p * 5 + ausschwingen(frame, start + 14, { amplitude: 2.5 }),
      brauen: -p * 8,
      mund: t > 8 ? "offen" : "neutral",
    };
  }

  if (name === "winken") {
    const hoch = interpolate(t, [0, 14], [0, 1], {
      easing: AUFTRITT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    // Winken selbst ist eine Schwingung, aber nur solange der Arm oben ist -
    // also ein Ereignis mit Anfang und Ende, keine Dauerbewegung.
    const winken = t > 12 && t < 60 ? Math.sin((t - 12) / 3.4) * 15 : 0;
    return {
      ...grund,
      schulterR: -6 - hoch * 140,
      ellbogenR: -5 - hoch * 22 + winken,
      kopf: hoch * 5,
      mund: t > 6 ? "laecheln" : "neutral",
    };
  }

  // zeigen
  const p = interpolate(t, [0, 13], [0, 1], {
    easing: AUFTRITT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    ...grund,
    schulterR: -6 - p * 84 + ausschwingen(frame, start + 13, { amplitude: 5 }),
    ellbogenR: -5 - p * 42 + ausschwingen(frame, start + 13, { amplitude: 6, glied: 1 }),
    kopf: p * 7,
    brauen: -p * 3,
    mund: "laecheln",
  };
};

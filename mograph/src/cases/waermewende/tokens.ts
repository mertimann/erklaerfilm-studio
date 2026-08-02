/**
 * TOKENS des Falls "waermewende" — nur das Fallspezifische:
 * die gemessenen Sprechdauern. Alles andere kommt aus den Bausteinen.
 */
export * from "../../bausteine/basis";
import { f } from "../../bausteine/basis";

/** Sprechdauern der frisch erzeugten deutschen VO, in Sekunden. Gemessen. */
export const BEATS = {
  s01: 8.42, // was eine Waermepumpe tut, -70 %
  s02: 6.38, // Kaufpreis 35.000
  s03: 3.94, // die Loesung: mieten. Kapitelwechsel
  s04: 6.01, // Schritt 1: Beratung
  s05: 5.61, // Schritt 2: Einbau
  s06: 9.68, // Schritt 3: feste Rate, alles inklusive
  s07: 4.77, // Service kostenlos
  s08: 4.91, // das Geld bleibt
  s09: 6.63, // Marke, Preis, CTA
} as const;

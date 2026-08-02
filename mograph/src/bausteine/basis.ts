/**
 * BASIS — fallunabhängige Konstanten: Format, Kurven, Schrift, Standardpalette.
 *
 * Aufbau nach dem Vorbild eines echten, mit Remotion produzierten
 * Motion-Design-Films (naveen-annam/creativly.ai-brand-video-remotion): eine
 * zentrale Konstantendatei, eine Datei pro Szene, und die Szenenlängen stehen
 * hier — nicht verstreut im Code.
 *
 * BEATS kommt aus den gemessenen Sprechdauern der deutschen VO
 * (archiv/waermewende/state.json). Damit sitzt das Bild auf dem Text, ohne dass
 * jemand nachträglich schiebt.
 */
export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  // dunkle Grundfläche, kein Schwarz - Schwarz wirkt im Video hart
  tief: "#0E1626",
  tiefer: "#080D17",
  flaeche: "#182338",
  linie: "rgba(255,255,255,0.10)",
  linieHell: "rgba(255,255,255,0.24)",

  weiss: "#FFFFFF",
  text: "#EEF2F8",
  gedaempft: "#8FA0BC",
  schwach: "#4E5F7D",

  // Wärme = Marke, Kalt = das Alte, Warnung = der Schmerzpunkt
  waerme: "#FF7A29",
  waermeHell: "#FFA05C",
  waermeDunkel: "#D45B12",
  kalt: "#3FB6C9",
  gruen: "#3DD68C",
  rot: "#FF4D5E",
  sand: "#F7C96E",
} as const;


/** Übergänge zwischen den Szenen. Jeder ist gestaltet, keiner ist ein Schnitt. */
export const UEBERGANG = 16;

export const E = {
  /** Auftritt: schnell rein, sauber ausgebremst. Der Standard. */
  auftritt: [0.16, 1, 0.3, 1] as const,
  /** noch härterer Snap, für kurze Distanzen */
  snap: [0.19, 1, 0.22, 1] as const,
  /** schwingt über das Ziel - sparsam */
  ueber: [0.34, 1.56, 0.64, 1] as const,
  /** ruhig und symmetrisch - Kamerafahrten, lange Wege */
  ruhig: [0.45, 0, 0.55, 1] as const,
  /** Abgang: startet langsam, beschleunigt weg */
  abgang: [0.333, 0, 0.667, 0] as const,
} as const;

export const SCHRIFT =
  '"Inter", "Helvetica Neue", Helvetica, Arial, "Segoe UI", system-ui, sans-serif';

/** Title-Safe: bei 1920 mindestens 140 px Rand. */
export const RAND = 140;

export const f = (sekunden: number) => Math.round(sekunden * FPS);

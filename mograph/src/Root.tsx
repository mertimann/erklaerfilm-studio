import React from "react";
import { Composition } from "remotion";
import { WaermeWende, laenge } from "./cases/waermewende/WaermeWende";

/**
 * Jeder Fall registriert hier seine Komposition. Neue Faelle entstehen als
 * Ordner unter src/cases/<name>/ nach dem Muster von waermewende -
 * der Ablauf steht in mograph/ANLEITUNG.md.
 */
export const RemotionRoot: React.FC = () => (
  <Composition id="WaermeWende" component={WaermeWende} fps={30}
    width={1920} height={1080} durationInFrames={laenge()} />
);

/**
 * S01 — "Eine Wärmepumpe holt Wärme aus der Luft und heizt damit Ihr ganzes
 *        Haus. Bis zu 70 % günstiger als Öl oder Gas."  (8,42 s)
 *
 * Hell, eine Farbwelt: Creme-Grund, Navy-Zeichnung, Orange für Wärme, Cyan nur
 * für die Luft. Keine Titelzeile, keine Kamerafahrt - die Erklärung passiert
 * ausschliesslich am Objekt: Luft zieht ins Gerät, der Wärmefluss wandert durchs
 * Rohr in den Heizkörper, der warm wird. Die −70 % stehen oben links im Leerraum.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p } from "../../../bausteine/lib";
import { Heizkoerper } from "../../../bausteine/welt";
import { Aussengeraet, FlussPunkte, Label, LuftStrom } from "../../../bausteine/geraete";
import { Ueberschrift, Untertitel } from "../../../bausteine/ui";

const ROHR = "M 1010 812 L 1450 812 L 1450 776";

export const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const an = p(frame, 16, 22, E.ueber);
  const warm = p(frame, 96, 40, E.ruhig);
  const prozent = Math.round(70 * p(frame, 150, 45, E.auftritt, 2));

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
        {/* Boden */}
        <rect x={0} y={860} width={1920} height={220} fill="#E7DFD2" />
        <rect x={0} y={860} width={1920} height={5} fill="#C9BFAE" />

        {/* Hausschnitt rechts: weisse Flaeche mit Navy-Kontur */}
        <g opacity={p(frame, 4, 14)}>
          <rect x={1180} y={250} width={700} height={610} rx={18} fill="#FFFFFF" stroke="#31456B" strokeWidth={10} />
          <path d="M 1160 250 L 1530 130 L 1900 250" fill="none" stroke="#31456B" strokeWidth={10} strokeLinejoin="round" />
          {/* Fenster, wird warm */}
          <rect x={1620} y={330} width={190} height={160} rx={10} fill="#FFCF7A" opacity={0.3 + warm * 0.65} />
          <rect x={1620} y={330} width={190} height={160} rx={10} fill="none" stroke="#31456B" strokeWidth={7} />
          <line x1={1715} y1={330} x2={1715} y2={490} stroke="#31456B" strokeWidth={6} />
        </g>

        <LuftStrom x={640} y={770} aktiv={an} farbe="#3FB6C9" />
        <Aussengeraet x={830} y={760} s={1.3} an={an} />

        {/* Rohr + Waermefluss ins Haus */}
        <path d={ROHR} fill="none" stroke="#31456B" strokeWidth={20} strokeLinecap="round" opacity={p(frame, 40, 14)} />
        <FlussPunkte d={ROHR} start={70} farbe={C.waerme} n={7} r={8} tempo={100} />

        <g opacity={p(frame, 50, 14)}>
          <Heizkoerper x={1460} y={740} s={1.2} warm={warm} />
        </g>
        {[0, 1, 2].map((i) => {
          const t = ((frame * 1.4 + i * 21) % 64) / 64;
          return (
            <path key={i} d={`M ${1415 + i * 44} ${648 - t * 88} q 20 -18 40 0`} fill="none"
              stroke={C.waerme} strokeWidth={6} strokeLinecap="round" opacity={(1 - t) * 0.8 * warm} />
          );
        })}

        <Label x={830} y={540} text="Wärmepumpe" start={34} zeiger={66} />
        <Label x={1500} y={540} text="Heizkörper" start={116} zeiger={62} />
        <Label x={450} y={640} text="Luft" start={54} zeiger={56} />
      </svg>

      <Ueberschrift text="So heizt eine Wärmepumpe" start={8} hell />
      {/* Der eine Zahlwert, unter der Überschrift */}
      <div style={{ position: "absolute", left: 150, top: 280, fontFamily: SCHRIFT, opacity: p(frame, 148, 10) }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: "#8A7E6C", letterSpacing: "0.16em" }}>HEIZKOSTEN</div>
        <div style={{ fontSize: 150, fontWeight: 900, color: C.waermeDunkel, lineHeight: 1.05 }}>−{prozent} %</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#8A7E6C" }}>gegenüber Öl und Gas</div>
      </div>
      <Untertitel hell segmente={[["Eine Wärmepumpe holt Wärme aus der Luft und heizt damit Ihr ganzes Haus.", 4], ["Bis zu 70 % günstiger als Öl oder Gas.", 152]]} />
    </AbsoluteFill>
  );
};

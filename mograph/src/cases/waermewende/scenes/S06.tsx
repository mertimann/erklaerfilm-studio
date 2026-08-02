/**
 * S06 — "Schritt drei: feste Monatsrate ab 189 €. Einbau, Wartung und
 *        Reparaturen sind schon drin."  (9,68 s — die laengste Szene)
 * Hell. Links zaehlt die Rate hoch, darunter fuellen sich zwoelf Monatsfelder
 * im Takt. Rechts haken sich die drei Inklusivleistungen ab. Zwei Beats,
 * die exakt der Satzstruktur folgen.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, E, SCHRIFT, f, BEATS } from "../tokens";
import { p, Zahl, Haken } from "../../../bausteine/lib";
import { Schritt, Untertitel } from "../../../bausteine/ui";

const MONATE = ["J","F","M","A","M","J","J","A","S","O","N","D"];
const INKLUSIV = ["Einbau", "Wartung", "Reparaturen"];

export const S06: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 150, top: 390, fontFamily: SCHRIFT }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#8A7E6C", letterSpacing: "0.14em",
            opacity: p(frame, 14, 10) }}>IHRE MONATSRATE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontSize: 56, fontWeight: 700, color: "#14243E", opacity: p(frame, 22, 10) }}>ab</span>
            <Zahl bis={189} start={24} dauer={40}
              stil={{ fontSize: 230, fontWeight: 900, color: C.waermeDunkel, lineHeight: 1 }} />
            <span style={{ fontSize: 110, fontWeight: 900, color: C.waermeDunkel, opacity: p(frame, 40, 8) }}>€</span>
          </div>
          {/* 12 Monatsfelder fuellen sich */}
          <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
            {MONATE.map((m, i) => {
              const q = p(frame, 60 + i * 4, 10, E.ueber);
              return (
                <div key={i} style={{ width: 56, height: 72, borderRadius: 12,
                  backgroundColor: q > 0.05 ? C.waerme : "#E2D8C6",
                  scale: `${(0.7 + 0.3 * q).toFixed(3)}`,
                  display: "flex", alignItems: "flex-end", justifyContent: "center",
                  paddingBottom: 8, fontFamily: SCHRIFT, fontSize: 24, fontWeight: 800,
                  color: q > 0.05 ? "#FFF" : "#B4A88F" }}>{m}</div>
              );
            })}
          </div>
        </div>

        {/* Inklusiv-Liste rechts */}
        <div style={{ position: "absolute", right: 170, top: 420 }}>
          <div style={{ fontFamily: SCHRIFT, fontSize: 36, fontWeight: 800, color: "#8A7E6C",
            letterSpacing: "0.14em", marginBottom: 26, opacity: p(frame, 130, 10) }}>SCHON DRIN</div>
          {INKLUSIV.map((t, i) => {
            const q = p(frame, 140 + i * 26, 12);
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 28,
                opacity: q, translate: `${((1 - q) * 70).toFixed(0)}px 0px` }}>
                <Haken start={142 + i * 26} groesse={60} farbe={C.waerme} />
                <span style={{ fontFamily: SCHRIFT, fontSize: 54, fontWeight: 800, color: "#14243E" }}>{t}</span>
              </div>
            );
          })}
        </div>

        <Schritt n={3} titel="Feste Monatsrate" start={6} />
      </AbsoluteFill>
      <Untertitel hell segmente={[["Schritt drei: eine feste Monatsrate – ab 189 Euro.", 4], ["Einbau, Wartung und Reparaturen sind schon drin.", 150]]} />
    </AbsoluteFill>
  );
};

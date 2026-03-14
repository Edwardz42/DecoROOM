import { useState } from "react";
import { COLORS, FONTS, diffColor, diffBg } from "../constants";

const MONO = "'JetBrains Mono', monospace";
const GLOW = (col = COLORS.accent, str = 0.4) => `0 0 20px rgba(74,144,226,${str})`;

// ── Master page shell – matches landing.html shell (radial bg, top-left logo, top-right nav) ─–
export function GameLayout({ title, onBack, children }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgGrad, fontFamily: MONO, boxSizing: "border-box", position: "relative" }}>
      <style>{FONTS}</style>

      {/* Top-left logo – mirrors landing <CS> prefix style */}
      <div style={{ position: "fixed", top: 28, left: 48, zIndex: 200, display: "flex", alignItems: "center", gap: 12, pointerEvents: "none" }}>
        <span style={{ color: COLORS.accent, fontWeight: 800, fontSize: "1.5rem", textShadow: `0 0 10px rgba(74,144,226,0.4)` }}>&lt;CS&gt;</span>
        <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 400, fontSize: "1.5rem", textTransform: "uppercase", letterSpacing: 4 }}>Gacha!</span>
      </div>

      {/* Top-right nav – mirrors landing .nav-right */}
      <div style={{ position: "fixed", top: 36, right: 48, zIndex: 200, display: "flex", alignItems: "center", gap: 20 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontFamily: MONO, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 2, cursor: "pointer" }}
          onMouseEnter={e => e.target.style.color = COLORS.accent}
          onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}
        >
          ← Back
        </button>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
        <span style={{ color: COLORS.accent, fontWeight: 800, fontSize: "0.85rem", letterSpacing: 3, textTransform: "uppercase" }}>{title}</span>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 48px" }}>
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, style }) {
  return (
    <div style={{
      background: "rgba(13,26,45,0.85)",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 6,
      padding: 24,
      backdropFilter: "blur(4px)",
      ...style
    }}>
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: 4, textTransform: "uppercase", fontFamily: MONO }}>
      {children}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: COLORS.border, margin: "18px 0" }} />;
}

export function ActionBtn({ onClick, label, accent = COLORS.accent, disabled, flex }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? "rgba(255,255,255,0.04)" : hov ? accent : "transparent",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.12)" : accent}`,
        borderRadius: 4,
        padding: "13px 28px",
        color: disabled ? "rgba(255,255,255,0.3)" : COLORS.text,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.75rem",
        letterSpacing: 3,
        fontFamily: MONO,
        fontWeight: 800,
        width: flex ? "100%" : "auto",
        transition: "all 0.15s",
        boxShadow: hov && !disabled ? GLOW() : "none",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}

export function TopicTag({ topic }) {
  return (
    <span style={{
      background: "rgba(74,144,226,0.08)",
      border: `1px solid rgba(74,144,226,0.3)`,
      borderRadius: 3,
      padding: "2px 8px",
      fontSize: "0.6rem",
      color: "rgba(74,144,226,0.9)",
      letterSpacing: 1,
      whiteSpace: "nowrap",
      fontFamily: MONO,
    }}>
      {topic}
    </span>
  );
}

export function DiffTag({ diff }) {
  return (
    <span style={{
      background: diffBg[diff],
      border: `1px solid ${diffColor[diff]}`,
      borderRadius: 3,
      padding: "2px 8px",
      fontSize: "0.6rem",
      color: diffColor[diff],
      letterSpacing: 1,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      fontFamily: MONO,
    }}>
      {diff}
    </span>
  );
}

export function FilterChip({ label, active, onClick, color }) {
  const c = color || COLORS.accent;
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `rgba(74,144,226,0.15)` : "transparent",
        border: `1px solid ${active ? c : "rgba(255,255,255,0.15)"}`,
        borderRadius: 3,
        padding: "4px 14px",
        color: active ? c : "rgba(255,255,255,0.4)",
        cursor: "pointer",
        fontSize: "0.65rem",
        letterSpacing: 2,
        fontFamily: MONO,
        textTransform: "uppercase",
        transition: "all 0.1s",
        boxShadow: active ? `0 0 10px rgba(74,144,226,0.2)` : "none",
      }}
    >
      {label}
    </button>
  );
}

export function PlayerChip({ name, status, color, pulse }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: pulse ? "chipPulse 1.5s infinite" : "none",
      }} />
      <div>
        <div style={{ fontSize: "0.85rem", color: COLORS.text, fontWeight: 800, fontFamily: MONO }}>{name}</div>
        <div style={{ fontSize: "0.6rem", color, letterSpacing: 2, fontFamily: MONO, textTransform: "uppercase" }}>{status}</div>
      </div>
      <style>{`@keyframes chipPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}

export function QuestionRow({ q, selected, onToggle, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={disabled ? null : onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: selected ? "rgba(74,144,226,0.12)" : hov ? "rgba(74,144,226,0.05)" : "rgba(13,26,45,0.7)",
        border: `1px solid ${selected ? COLORS.accent : hov ? "rgba(74,144,226,0.35)" : COLORS.border}`,
        borderRadius: 5,
        padding: "12px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: disabled ? 0.35 : 1,
        transition: "all 0.12s",
        boxShadow: selected ? `0 0 12px rgba(74,144,226,0.15)` : "none",
      }}
    >
      <div style={{
        width: 15, height: 15,
        border: `1px solid ${selected ? COLORS.accent : "rgba(255,255,255,0.2)"}`,
        borderRadius: 2,
        background: selected ? COLORS.accent : "transparent",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: "#000", fontSize: 9, fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ flex: 1, fontSize: "0.8rem", color: COLORS.text, fontFamily: MONO }}>{q.q}</div>
      <TopicTag topic={q.topic} />
      <DiffTag diff={q.diff} />
    </div>
  );
}




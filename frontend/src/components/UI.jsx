import { useState } from "react";
import { COLORS, FONTS, diffColor, diffBg } from "../constants";

export function GameLayout({ title, onBack, children }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Space Mono', monospace", padding: "20px 24px", boxSizing: "border-box" }}>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <button
            onClick={onBack}
            style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 14px", color: COLORS.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}
          >
            ← BACK
          </button>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: COLORS.text, letterSpacing: 3 }}>
            {title}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, style }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 4 }}>
      {children}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: COLORS.border, margin: "16px 0" }} />;
}

export function ActionBtn({ onClick, label, accent, disabled, flex }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? COLORS.surface : hov ? accent : "transparent",
        border: `2px solid ${disabled ? COLORS.border : accent}`,
        borderRadius: 4,
        padding: "14px 28px",
        color: disabled ? COLORS.textMuted : COLORS.text,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 12,
        letterSpacing: 2,
        fontFamily: "'Space Mono', monospace",
        fontWeight: 700,
        width: flex ? "100%" : "auto",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export function TopicTag({ topic }) {
  return (
    <span style={{ background: "#1e293b", border: `1px solid #334155`, borderRadius: 2, padding: "2px 8px", fontSize: 10, color: "#94a3b8", letterSpacing: 1, whiteSpace: "nowrap" }}>
      {topic}
    </span>
  );
}

export function DiffTag({ diff }) {
  return (
    <span style={{ background: diffBg[diff], border: `1px solid ${diffColor[diff]}`, borderRadius: 2, padding: "2px 8px", fontSize: 10, color: diffColor[diff], letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {diff}
    </span>
  );
}

export function FilterChip({ label, active, onClick, color }) {
  const c = color || COLORS.accent;
  return (
    <button
      onClick={onClick}
      style={{ background: active ? (color ? diffBg[label.toLowerCase()] || COLORS.accentDim : COLORS.accentDim) : "transparent", border: `1px solid ${active ? c : COLORS.border}`, borderRadius: 2, padding: "4px 12px", color: active ? c : COLORS.textMuted, cursor: "pointer", fontSize: 10, letterSpacing: 2, fontFamily: "'Space Mono', monospace", transition: "all 0.1s" }}
    >
      {label}
    </button>
  );
}

export function PlayerChip({ name, status, color, pulse }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, animation: pulse ? "pulse 1.5s infinite" : "none" }} />
      <div>
        <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 10, color, letterSpacing: 2 }}>{status}</div>
      </div>
    </div>
  );
}

export function QuestionRow({ q, selected, onToggle, disabled }) {
  return (
    <div
      onClick={disabled ? null : onToggle}
      style={{ background: selected ? COLORS.accentDim : COLORS.card, border: `1px solid ${selected ? COLORS.accentGlow : COLORS.border}`, borderRadius: 4, padding: "12px 16px", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 12, opacity: disabled ? 0.4 : 1, transition: "all 0.1s" }}
    >
      <div style={{ width: 16, height: 16, border: `2px solid ${selected ? COLORS.accentGlow : COLORS.border}`, borderRadius: 2, background: selected ? COLORS.accentGlow : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {selected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: COLORS.text }}>{q.q}</div>
      <TopicTag topic={q.topic} />
      <DiffTag diff={q.diff} />
    </div>
  );
}

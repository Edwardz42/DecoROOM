import { COLORS } from "../constants";

export default function Timer({ timeLeft, max = 300 }) {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const color = timeLeft < 60 ? COLORS.red : timeLeft < 120 ? COLORS.gold : COLORS.green;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 800, color, lineHeight: 1, textShadow: `0 0 12px ${color}60` }}>
        {mins}:{secs}
      </div>
      <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 3, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>TIME LEFT</div>
      <div style={{ width: 160, height: 4, background: COLORS.surface, borderRadius: 2, overflow: "hidden", marginTop: 6, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ height: "100%", width: `${(timeLeft / max) * 100}%`, background: color, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

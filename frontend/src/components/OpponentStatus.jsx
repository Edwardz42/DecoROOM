import { COLORS } from "../constants";
import ProgressBar from "./ProgressBar";

export default function OpponentStatus({ oppScore, maxScore = 700, questionsTotal = 3, questionsDone = 0 }) {
  return (
    <div style={{ background: "rgba(13,26,45,0.8)", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(4px)" }}>
      <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 3, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>OPPONENT</div>
      <ProgressBar value={oppScore} max={maxScore} color={COLORS.red} />
      <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
        {questionsDone}/{questionsTotal} done · {oppScore}pts
      </div>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green, flexShrink: 0, animation: "pulse 1.5s infinite" }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

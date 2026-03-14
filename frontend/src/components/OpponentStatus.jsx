import { COLORS } from "../constants";
import ProgressBar from "./ProgressBar";

export default function OpponentStatus({ oppScore, maxScore = 700, questionsTotal = 3, questionsDone = 0 }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 2, flexShrink: 0 }}>OPPONENT</div>
      <ProgressBar value={oppScore} max={maxScore} color={COLORS.red} />
      <div style={{ fontSize: 12, color: COLORS.textMuted, flexShrink: 0 }}>
        {questionsDone}/{questionsTotal} done · {oppScore}pts
      </div>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green, flexShrink: 0, animation: "pulse 1.5s infinite" }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

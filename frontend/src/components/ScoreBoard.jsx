import { COLORS } from "../constants";

function ScorePanel({ label, score, color, right }) {
  return (
    <div style={{ textAlign: right ? "right" : "left", minWidth: 120 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 3 }}>{label}</div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 900, color }}>
        {score}
      </div>
    </div>
  );
}

export default function ScoreBoard({ playerScore, opponentScore }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <ScorePanel label="YOUR SCORE" score={playerScore} color={COLORS.accentGlow} />
      <ScorePanel label="OPPONENT"   score={opponentScore} color={COLORS.red} right />
    </div>
  );
}

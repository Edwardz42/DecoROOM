import { COLORS } from "../constants";
import { TopicTag, DiffTag } from "./UI";

export default function QuestionPanel({ question, aiResponse, feedback }) {
  return (
    <div style={{ background: "rgba(13,26,45,0.85)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 24, backdropFilter: "blur(4px)" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <TopicTag topic={question.topic || "Algorithms"} />
          <DiffTag diff={question.diff} />
        </div>
        <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
          {question.pts} pts
          {question.aiHelp && (
            <span style={{ color: COLORS.gold }}> → {Math.round(question.pts * 0.5)} (hint)</span>
          )}
        </div>
      </div>

      {/* Question text */}
      <div style={{ fontSize: "1rem", color: COLORS.text, lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace" }}>
        {question.q}
      </div>

      {/* AI hint */}
      {aiResponse && (
        <div style={{ marginTop: 16, background: "rgba(74,144,226,0.06)", border: "1px solid rgba(74,144,226,0.35)", borderRadius: 5, padding: 14, fontSize: "0.78rem", color: "rgba(200,220,255,0.9)", lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: "#4A90E2", fontWeight: 800, letterSpacing: 2 }}>AI HINT · </span>
          {aiResponse}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{ marginTop: 16, background: feedback.correct ? "rgba(80,250,123,0.07)" : "rgba(255,85,85,0.07)", border: `1px solid ${feedback.correct ? COLORS.green : COLORS.red}`, borderRadius: 5, padding: 14, fontSize: "0.78rem", color: feedback.correct ? COLORS.green : COLORS.red, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ fontWeight: 700 }}>+{feedback.pts} pts · </span>
          {feedback.text}
          {feedback.meta && (
            <div style={{ marginTop: 8, color: COLORS.textMuted }}>
              {feedback.meta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

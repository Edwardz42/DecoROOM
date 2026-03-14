import { COLORS } from "../constants";
import { TopicTag, DiffTag } from "./UI";

export default function QuestionPanel({ question, aiResponse, feedback }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 24 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <TopicTag topic={question.topic || "Algorithms"} />
          <DiffTag diff={question.diff} />
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          {question.pts} pts
          {question.aiHelp && (
            <span style={{ color: COLORS.gold }}> → {Math.round(question.pts * 0.5)} (hint)</span>
          )}
        </div>
      </div>

      {/* Question text */}
      <div style={{ fontSize: 16, color: COLORS.text, lineHeight: 1.7 }}>
        {question.q}
      </div>

      {/* AI hint */}
      {aiResponse && (
        <div style={{ marginTop: 16, background: "#1e1b4b", border: `1px solid #4338ca`, borderRadius: 4, padding: 12, fontSize: 12, color: "#a5b4fc", lineHeight: 1.6 }}>
          <span style={{ color: "#818cf8", fontWeight: 700, letterSpacing: 2 }}>AI HINT · </span>
          {aiResponse}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{ marginTop: 16, background: feedback.correct ? "#052e16" : "#450a0a", border: `1px solid ${feedback.correct ? COLORS.green : COLORS.red}`, borderRadius: 4, padding: 12, fontSize: 12, color: feedback.correct ? COLORS.green : COLORS.red, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700 }}>+{feedback.pts} pts · </span>
          {feedback.text}
        </div>
      )}
    </div>
  );
}

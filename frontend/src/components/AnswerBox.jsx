import { COLORS } from "../constants";
import { ActionBtn } from "./UI";

export default function AnswerBox({ answer, onChange, onSubmit, onHint, aiHelpUsed, loading, feedback, onNext, isLast }) {
  return (
    <>
      {/* Textarea */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 16 }}>
        <textarea
          value={answer}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your answer here…"
          rows={5}
          style={{ width: "100%", background: "transparent", border: "none", color: COLORS.text, fontSize: 14, fontFamily: "'Space Mono', monospace", lineHeight: 1.7, boxSizing: "border-box", resize: "none", outline: "none" }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        {!feedback ? (
          <>
            <ActionBtn
              onClick={onSubmit}
              label={loading ? "EVALUATING…" : "SUBMIT ANSWER"}
              accent={COLORS.accent}
              disabled={!answer.trim() || loading}
              flex
            />
            <button
              onClick={onHint}
              disabled={aiHelpUsed || loading}
              style={{ background: "transparent", border: `1px solid ${COLORS.gold}`, borderRadius: 4, padding: "14px 20px", color: aiHelpUsed ? COLORS.textMuted : COLORS.gold, cursor: aiHelpUsed ? "not-allowed" : "pointer", fontSize: 12, letterSpacing: 2, fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}
            >
              {aiHelpUsed ? "HINT USED" : "ASK AI (-50%)"}
            </button>
          </>
        ) : (
          <ActionBtn
            onClick={onNext}
            label={isLast ? "FINISH BATTLE →" : "NEXT QUESTION →"}
            accent={COLORS.green}
            flex
          />
        )}
      </div>
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import { COLORS, FONTS, normaliseQuestion } from "../constants";
import Timer from "../components/Timer";
import OpponentStatus from "../components/OpponentStatus";
import QuestionPanel from "../components/QuestionPanel";
import AnswerBox from "../components/AnswerBox";

const MONO = "'JetBrains Mono', monospace";

function formatMs(ms) {
  if (!ms || Number.isNaN(ms)) return "--:--";
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function BattlePage({ onNav }) {
  const roomId = localStorage.getItem("roomId");
  const playerId = localStorage.getItem("playerId");

  const [gameState, setGameState] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [aiHelp, setAiHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [error, setError] = useState("");

  const players = gameState?.players || {};
  const oppId = useMemo(() => Object.keys(players).find(id => id !== playerId), [players, playerId]);
  const myState = players[playerId] || {};
  const oppState = oppId ? players[oppId] : {};

  const timeLeftMs = gameState?.timeLeft || 0;
  const timeLeftSec = Math.floor(timeLeftMs / 1000);

  const persistResult = (state) => {
    const ps = state?.players || {};
    const me = ps[playerId] || {};
    const oppKey = Object.keys(ps).find(id => id !== playerId);
    const opp = oppKey ? ps[oppKey] : {};

    localStorage.setItem("lastScore", String(me.score || 0));
    localStorage.setItem("lastOppScore", String(opp.score || 0));
    localStorage.setItem("lastTime", formatMs(state?.timeLeft || 0));
    localStorage.setItem("lastWinnerPlayerId", state?.winnerPlayerId || "");
  };

  const fetchState = async () => {
    if (!roomId) return;
    try {
      const r = await fetch(`/api/game/${roomId}/state`);
      const s = await r.json();
      setGameState(s);

      if (s.status === "FINISHED" || s.phase === "FINISHED") {
        persistResult(s);
        onNav("results");
      }
    } catch {
      setError("Failed to load game state.");
    }
  };

  const fetchCurrentQuestion = async () => {
    if (!roomId || !playerId) return;
    try {
      const r = await fetch(`/api/game/${roomId}/question?playerId=${encodeURIComponent(playerId)}`);
      const data = await r.json();
      if (data.gameOver) {
        await fetchState();
        return;
      }
      if (data.completed) {
        setQuestionData(null);
        setWaitingForNext(true);
        return;
      }

      const q = normaliseQuestion(data.question || {});
      setQuestionData({
        questionId: data.questionId,
        question: q,
      });
      setWaitingForNext(false);
    } catch {
      setError("Failed to load question.");
    }
  };

  useEffect(() => {
    if (!roomId || !playerId) return;
    fetchState();
    fetchCurrentQuestion();

    const poll = setInterval(() => {
      fetchState();
    }, 1000);

    return () => clearInterval(poll);
  }, [roomId, playerId]);

  const submitAnswer = async () => {
    if (!answer.trim() || !questionData) return;
    setLoading(true);
    setFeedback(null);
    setError("");

    try {
      const r = await fetch(`/api/game/${roomId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          questionId: questionData.questionId,
          answer,
        }),
      });
      const data = await r.json();

      if (!r.ok || data.error) {
        throw new Error(data.error || "Answer submission failed");
      }

      setFeedback({
        text: data.feedback || (data.correct ? "Correct answer." : "Not quite correct."),
        pts: data.points || 0,
        correct: !!data.correct,
        meta: data.grading?.usedElastic
          ? `AI: ${Math.round(Number(data.grading.rawScore || 0) * 100)}/100 · threshold ${Math.round(Number(data.grading.threshold || 0) * 100)}/100`
          : null,
      });

      await fetchState();

      if (data.gameOver) {
        const stateRes = await fetch(`/api/game/${roomId}/state`);
        const state = await stateRes.json();
        persistResult(state);
        onNav("results");
      }
    } catch (e) {
      setError(e.message || "Could not submit answer.");
    }

    setLoading(false);
  };

  const getHint = async () => {
    if (!questionData) return;
    setLoading(true);
    setAiHelp(true);

    try {
      const r = await fetch(`/api/game/${roomId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, playerInput: answer || null }),
      });
      const data = await r.json();
      setAiResponse(data.hint || "Think about core CS principles.");
    } catch {
      setAiResponse("Think about core CS principles.");
    }

    setLoading(false);
  };

  const nextQuestion = async () => {
    setAnswer("");
    setFeedback(null);
    setAiResponse("");
    setAiHelp(false);
    await fetchCurrentQuestion();
  };

  if (!roomId || !playerId) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bgGrad, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.red, fontFamily: MONO }}>
        <style>{FONTS}</style>
        Missing room session. Go back to lobby and create/join a room.
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgGrad, fontFamily: MONO, padding: 20, boxSizing: "border-box" }}>
      <style>{`${FONTS} textarea{resize:none;outline:none;}`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ textAlign: "left", minWidth: 120 }}>
          <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 4, fontFamily: MONO }}>YOUR SCORE</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 32, color: COLORS.accent, textShadow: "0 0 16px rgba(74,144,226,0.5)" }}>{myState.score || 0}</div>
        </div>

        <Timer timeLeft={timeLeftSec} max={600} />

        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 4, fontFamily: MONO }}>OPPONENT</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 32, color: COLORS.red }}>{oppState.score || 0}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <OpponentStatus
          oppScore={oppState.score || 0}
          maxScore={5000}
          questionsTotal={8}
          questionsDone={oppState.currentIndex || 0}
        />
      </div>

      {!questionData && waitingForNext && (
        <div style={{ background: "rgba(13,26,45,0.85)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 22, color: COLORS.textMuted, fontFamily: MONO }}>
          You completed your deck. Waiting for opponent or timer end...
        </div>
      )}

      {!questionData && !waitingForNext && (
        <div style={{ background: "rgba(13,26,45,0.85)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 22, color: COLORS.textMuted, fontFamily: MONO }}>
          Loading current question...
        </div>
      )}

      {questionData && (
        <>
          <div style={{ marginBottom: 16 }}>
            <QuestionPanel
              question={{ ...questionData.question, aiHelp }}
              aiResponse={aiResponse}
              feedback={feedback}
            />
          </div>

          <AnswerBox
            answer={answer}
            onChange={setAnswer}
            onSubmit={submitAnswer}
            onHint={getHint}
            aiHelpUsed={aiHelp}
            loading={loading}
            feedback={feedback}
            onNext={nextQuestion}
            isLast={(myState.currentIndex || 0) >= 7}
          />
        </>
      )}

      <div style={{ marginTop: 12, color: COLORS.textMuted, fontFamily: MONO, fontSize: "0.7rem" }}>
        Room: {roomId} · Time Left: {formatMs(timeLeftMs)}
      </div>

      {error && <div style={{ marginTop: 6, color: COLORS.red, fontFamily: MONO, fontSize: "0.72rem" }}>{error}</div>}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { COLORS, FONTS, MOCK_COLLECTION, normaliseQuestion } from "../constants";
import Timer from "../components/Timer";
import OpponentStatus from "../components/OpponentStatus";
import QuestionPanel from "../components/QuestionPanel";
import AnswerBox from "../components/AnswerBox";

const MONO = "'JetBrains Mono', monospace";

function getDeckIds() {
  try {
    return JSON.parse(localStorage.getItem("selectedDeckIds") || "[]");
  } catch {
    return [];
  }
}

function formatMs(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function SoloBattlePage({ onNav }) {
  const [deckQuestions, setDeckQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [aiHelp, setAiHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600);
  const [error, setError] = useState("");

  useEffect(() => {
    const deckIds = new Set(getDeckIds());
    fetch("/api/gacha/questions")
      .then(r => r.json())
      .then(qs => {
        const picked = qs.map(normaliseQuestion).filter(q => deckIds.has(q.id));
        setDeckQuestions(picked);
      })
      .catch(() => {
        const fallback = MOCK_COLLECTION.filter(q => deckIds.has(q.id));
        setDeckQuestions(fallback);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.setItem("lastScore", String(myScore));
          localStorage.setItem("lastOppScore", String(aiScore));
          localStorage.setItem("lastTime", "0:00");
          localStorage.setItem("lastWinnerPlayerId", myScore >= aiScore ? (localStorage.getItem("playerId") || "solo") : "solo-ai");
          onNav("results");
          return 0;
        }
        return prev - 1;
      });

      setAiScore(s => Math.min(s + (Math.random() > 0.85 ? 60 : 12), 6000));
    }, 1000);

    return () => clearInterval(timer);
  }, [myScore, aiScore, onNav]);

  const current = deckQuestions[idx];
  const total = deckQuestions.length;

  const submitAnswer = async () => {
    if (!current || !answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    setError("");

    try {
      const r = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current.q, answer, usedHint: aiHelp }),
      });
      const data = await r.json();
      const pts = Math.round((Number(data.score || 0) / 100) * (current.pts || 200) * (aiHelp ? 0.5 : 1));
      setMyScore(s => s + pts);
      setFeedback({ text: data.feedback || "Submitted", pts, correct: !!data.isCorrect });
    } catch {
      setError("Could not evaluate answer.");
      setFeedback({ text: "No score awarded.", pts: 0, correct: false });
    }

    setLoading(false);
  };

  const getHint = async () => {
    if (!current) return;
    setAiHelp(true);
    setLoading(true);
    try {
      const r = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current.q }),
      });
      const data = await r.json();
      setAiResponse(data.hint || "Think from first principles.");
    } catch {
      setAiResponse("Think from first principles.");
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setAnswer("");
      setFeedback(null);
      setAiResponse("");
      setAiHelp(false);
      return;
    }

    localStorage.setItem("lastScore", String(myScore));
    localStorage.setItem("lastOppScore", String(aiScore));
    localStorage.setItem("lastTime", formatMs(timeLeft * 1000));
    localStorage.setItem("lastWinnerPlayerId", myScore >= aiScore ? (localStorage.getItem("playerId") || "solo") : "solo-ai");
    onNav("results");
  };

  const progressDone = useMemo(() => idx, [idx]);

  if (!current) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bgGrad, color: COLORS.textMuted, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
        <style>{FONTS}</style>
        {deckQuestions.length === 0 ? "No saved 8-card deck found. Build and save your deck first." : "Loading battle..."}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgGrad, fontFamily: MONO, padding: 20, boxSizing: "border-box" }}>
      <style>{`${FONTS} textarea{resize:none;outline:none;}`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ textAlign: "left", minWidth: 120 }}>
          <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 4, fontFamily: MONO }}>YOUR SCORE</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 32, color: COLORS.accent, textShadow: "0 0 16px rgba(74,144,226,0.5)" }}>{myScore}</div>
        </div>

        <Timer timeLeft={timeLeft} max={600} />

        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 4, fontFamily: MONO }}>AI OPPONENT</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 32, color: COLORS.red }}>{aiScore}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <OpponentStatus oppScore={aiScore} maxScore={6000} questionsTotal={total} questionsDone={progressDone} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <QuestionPanel question={{ ...current, aiHelp }} aiResponse={aiResponse} feedback={feedback} />
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
        isLast={idx === total - 1}
      />

      <div style={{ marginTop: 12, color: COLORS.textMuted, fontFamily: MONO, fontSize: "0.72rem" }}>
        Solo 1v1 • Question {idx + 1}/{total}
      </div>
      {error && <div style={{ marginTop: 8, color: COLORS.red, fontFamily: MONO, fontSize: "0.72rem" }}>{error}</div>}
    </div>
  );
}

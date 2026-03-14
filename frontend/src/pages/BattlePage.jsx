import { useState, useEffect } from "react";
import { COLORS, FONTS } from "../constants";
import Timer from "../components/Timer";
import ScoreBoard from "../components/ScoreBoard";
import ProgressBar from "../components/ProgressBar";
import OpponentStatus from "../components/OpponentStatus";
import QuestionPanel from "../components/QuestionPanel";
import AnswerBox from "../components/AnswerBox";

const QUESTIONS = [
  { q: "What is the time complexity of quicksort in the worst case?",       topic: "Algorithms", diff: "easy",   pts: 100 },
  { q: "Explain how a hash map handles collisions using chaining.",          topic: "DSA",        diff: "medium", pts: 200 },
  { q: "Implement and explain a LRU cache.",                                 topic: "DSA",        diff: "hard",   pts: 400 },
];

export default function BattlePage({ onNav }) {
  const [timeLeft,    setTimeLeft]    = useState(300);
  const [qIdx,        setQIdx]        = useState(0);
  const [answer,      setAnswer]      = useState("");
  const [score,       setScore]       = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [aiHelp,      setAiHelp]      = useState(false);
  const [feedback,    setFeedback]    = useState(null);
  const [aiResponse,  setAiResponse]  = useState("");
  const [loading,     setLoading]     = useState(false);

  const currentQ = QUESTIONS[qIdx];

  // Countdown + opponent simulation
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(x => {
        if (x <= 0) { clearInterval(t); onNav("results"); return 0; }
        return x - 1;
      });
      setOppScore(x => Math.min(x + (Math.random() > 0.9 ? 50 : 0), 600));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const helpNote = aiHelp ? "The user used an AI hint (reduce points by 50%)." : "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `You are a coding quiz judge. Question: "${currentQ.q}". User's answer: "${answer}". ${helpNote} Rate correctness 0-100 and give 1-sentence feedback. Respond ONLY as JSON: {"score":number,"feedback":"string"}`,
          }],
        }),
      });
      const data   = await res.json();
      const text   = data.content.map(c => c.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const pts    = Math.round((parsed.score / 100) * currentQ.pts * (aiHelp ? 0.5 : 1));
      setScore(s => s + pts);
      setFeedback({ text: parsed.feedback, pts, correct: parsed.score > 60 });
    } catch {
      setFeedback({ text: "Could not evaluate. Moving on.", pts: 0, correct: false });
    }
    setLoading(false);
  };

  const getHint = async () => {
    setAiHelp(true);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 150,
          messages: [{ role: "user", content: `Give a short hint (2-3 sentences, no full answer) for: "${currentQ.q}"` }],
        }),
      });
      const data = await res.json();
      setAiResponse(data.content[0]?.text || "Think carefully about the fundamentals.");
    } catch {
      setAiResponse("Think about the core data structures involved.");
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(q => q + 1);
      setAnswer("");
      setAiHelp(false);
      setAiResponse("");
      setFeedback(null);
    } else {
      onNav("results");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Space Mono', monospace", padding: 20, boxSizing: "border-box" }}>
      <style>{`${FONTS} textarea{resize:none;outline:none;}`}</style>

      {/* Top HUD: scores + timer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ textAlign: "left", minWidth: 120 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 3 }}>YOUR SCORE</div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 900, color: COLORS.accentGlow }}>{score}</div>
        </div>

        <Timer timeLeft={timeLeft} max={300} />

        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 3 }}>OPPONENT</div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 900, color: COLORS.red }}>{oppScore}</div>
        </div>
      </div>

      {/* Opponent activity bar */}
      <div style={{ marginBottom: 16 }}>
        <OpponentStatus
          oppScore={oppScore}
          maxScore={700}
          questionsTotal={QUESTIONS.length}
          questionsDone={Math.floor(oppScore / 200)}
        />
      </div>

      {/* Question */}
      <div style={{ marginBottom: 16 }}>
        <QuestionPanel
          question={{ ...currentQ, aiHelp }}
          aiResponse={aiResponse}
          feedback={feedback}
        />
      </div>

      {/* Answer box + action buttons */}
      <AnswerBox
        answer={answer}
        onChange={setAnswer}
        onSubmit={submitAnswer}
        onHint={getHint}
        aiHelpUsed={aiHelp}
        loading={loading}
        feedback={feedback}
        onNext={nextQuestion}
        isLast={qIdx === QUESTIONS.length - 1}
      />
    </div>
  );
}

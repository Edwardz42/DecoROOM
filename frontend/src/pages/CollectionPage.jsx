import { useState, useEffect } from "react";
import { COLORS, MOCK_COLLECTION, diffColor, normaliseQuestion } from "../constants";
import { GameLayout, Label, TopicTag, DiffTag, FilterChip } from "../components/UI";

const MONO = "'JetBrains Mono', monospace";

function getUnlockedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem("unlockedQuestionIds") || "[]"));
  } catch {
    return new Set();
  }
}

export default function CollectionPage({ onNav }) {
  const [filterTopic, setFilterTopic] = useState("ALL");
  const [filterDiff,  setFilterDiff]  = useState("ALL");
  const [collection, setCollection] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [unlocked, setUnlocked] = useState(new Set());

  useEffect(() => {
    setUnlocked(getUnlockedSet());
    fetch("/api/gacha/questions")
      .then(r => r.json())
      .then(qs => setCollection(qs.map(normaliseQuestion)))
      .catch(() => setCollection(MOCK_COLLECTION))
      .finally(() => setLoading(false));
  }, []);

  const topics = ["ALL", ...new Set(collection.map(q => q.topic).filter(Boolean))];

  const visible = collection.filter(q =>
    (filterTopic === "ALL" || q.topic === filterTopic) &&
    (filterDiff  === "ALL" || q.diff  === filterDiff)
  );

  return (
    <GameLayout title="COLLECTION" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Topic filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 3, fontFamily: MONO }}>TOPIC:</div>
          {topics.map(t => (
            <FilterChip key={t} label={t} active={filterTopic === t} onClick={() => setFilterTopic(t)} />
          ))}
        </div>

        {/* Difficulty filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 3, fontFamily: MONO }}>DIFF:</div>
          {["ALL", "easy", "medium", "hard"].map(d => (
            <FilterChip
              key={d}
              label={d.toUpperCase()}
              active={filterDiff === d}
              onClick={() => setFilterDiff(d)}
              color={d !== "ALL" ? diffColor[d] : null}
            />
          ))}
        </div>

        {/* Count */}
        <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, marginBottom: 16, fontFamily: MONO, letterSpacing: 1 }}>
          {loading ? "Loading..." : `${unlocked.size} unlocked / ${collection.length} total · ${visible.length} shown`}
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gap: 8 }}>
          {loading ? (
            <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontFamily: MONO, padding: "40px 0", textAlign: "center", letterSpacing: 3 }}>Loading collection…</div>
          ) : visible.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontFamily: MONO, padding: "40px 0", textAlign: "center", letterSpacing: 2 }}>No questions match these filters.</div>
          ) : visible.map(q => {
            const isUnlocked = unlocked.has(q.id);
            return (
            <div
              key={q.id}
              style={{ background: "rgba(13,26,45,0.75)", border: `1px solid ${isUnlocked ? COLORS.border : "rgba(255,255,255,0.08)"}`, borderRadius: 5, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(2px)", transition: "border-color 0.12s", opacity: isUnlocked ? 1 : 0.45 }}
            >
              <div style={{ flex: 1, fontSize: "0.8rem", color: COLORS.text, fontFamily: MONO, lineHeight: 1.5 }}>
                {isUnlocked ? q.q : "Locked question"}
              </div>
              <TopicTag topic={q.topic} />
              <DiffTag  diff={q.diff}  />
            </div>
          );})}
        </div>

      </div>
    </GameLayout>
  );
}

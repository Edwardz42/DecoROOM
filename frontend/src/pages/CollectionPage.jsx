import { useState, useEffect } from "react";
import { COLORS, MOCK_COLLECTION, diffColor, normaliseQuestion } from "../constants";
import { GameLayout, Label, TopicTag, DiffTag, FilterChip } from "../components/UI";
import { API_BASE } from "../apiBase";

const MONO = "'JetBrains Mono', monospace";

function getUnlockedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem("unlockedQuestionIds") || "[]"));
  } catch {
    return new Set();
  }
}

function getDeckIds() {
  try {
    return JSON.parse(localStorage.getItem("selectedDeckIds") || "[]");
  } catch {
    return [];
  }
}

function saveDeckIds(ids) {
  localStorage.setItem("selectedDeckIds", JSON.stringify([...new Set(ids)]));
}

export default function CollectionPage({ onNav }) {
  const [filterTopic, setFilterTopic] = useState("ALL");
  const [filterDiff,  setFilterDiff]  = useState("ALL");
  const [collection, setCollection] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [unlocked, setUnlocked] = useState(new Set());
  const [deck, setDeck] = useState([]);

  useEffect(() => {
    setUnlocked(getUnlockedSet());
    setDeck(getDeckIds());
    fetch(`${API_BASE}/api/gacha/questions`)
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

  const toggleDeck = (id) => {
    if (deck.includes(id)) {
      setDeck(deck.filter(x => x !== id));
      return;
    }
    if (deck.length < 8) {
      setDeck([...deck, id]);
    }
  };

  const persistDeck = () => {
    saveDeckIds(deck);
  };

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
          {loading ? "Loading..." : `${unlocked.size} unlocked / ${collection.length} total · ${visible.length} shown · deck ${deck.length}/8`}
        </div>

        <div style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={persistDeck}
            disabled={deck.length !== 8}
            style={{ background: deck.length === 8 ? COLORS.accent : "transparent", border: `1px solid ${deck.length === 8 ? COLORS.accent : COLORS.border}`, borderRadius: 4, color: deck.length === 8 ? "#000" : COLORS.textMuted, padding: "8px 14px", fontFamily: MONO, fontSize: "0.7rem", letterSpacing: 2, cursor: deck.length === 8 ? "pointer" : "not-allowed" }}
          >
            Save to Deckbuilder
          </button>
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
              {isUnlocked && (
                <button
                  onClick={() => toggleDeck(q.id)}
                  style={{ background: deck.includes(q.id) ? COLORS.accentDim : "transparent", border: `1px solid ${deck.includes(q.id) ? COLORS.accent : COLORS.border}`, borderRadius: 4, color: deck.includes(q.id) ? COLORS.accent : COLORS.textMuted, padding: "6px 8px", fontFamily: MONO, fontSize: "0.62rem", letterSpacing: 1, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {deck.includes(q.id) ? "In Deck" : "Add"}
                </button>
              )}
              <TopicTag topic={q.topic} />
              <DiffTag  diff={q.diff}  />
            </div>
          );})}
        </div>

      </div>
    </GameLayout>
  );
}

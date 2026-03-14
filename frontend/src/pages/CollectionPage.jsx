import { useState } from "react";
import { COLORS, MOCK_COLLECTION, TOPICS, diffColor } from "../constants";
import { GameLayout, Label, TopicTag, DiffTag, FilterChip } from "../components/UI";

export default function CollectionPage({ onNav }) {
  const [filterTopic, setFilterTopic] = useState("ALL");
  const [filterDiff,  setFilterDiff]  = useState("ALL");

  const visible = MOCK_COLLECTION.filter(q =>
    (filterTopic === "ALL" || q.topic === filterTopic) &&
    (filterDiff  === "ALL" || q.diff  === filterDiff)
  );

  const ownedCount = MOCK_COLLECTION.filter(q => q.owned).length;

  return (
    <GameLayout title="COLLECTION" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Topic filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 2 }}>TOPIC:</div>
          {["ALL", ...TOPICS].map(t => (
            <FilterChip key={t} label={t} active={filterTopic === t} onClick={() => setFilterTopic(t)} />
          ))}
        </div>

        {/* Difficulty filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 2 }}>DIFF:</div>
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
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
          {ownedCount} / {MOCK_COLLECTION.length} questions unlocked
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gap: 8 }}>
          {visible.map(q => (
            <div
              key={q.id}
              style={{ background: COLORS.card, border: `1px solid ${q.owned ? COLORS.border : COLORS.surface}`, borderRadius: 4, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, opacity: q.owned ? 1 : 0.35, filter: q.owned ? "none" : "blur(0.5px)" }}
            >
              {!q.owned && <div style={{ fontSize: 16, flexShrink: 0 }}>🔒</div>}
              <div style={{ flex: 1, fontSize: 13, color: COLORS.text }}>
                {q.owned ? q.q : "??? Locked question"}
              </div>
              <TopicTag topic={q.topic} />
              <DiffTag  diff={q.diff}  />
            </div>
          ))}
        </div>

      </div>
    </GameLayout>
  );
}

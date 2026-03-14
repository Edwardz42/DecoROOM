import { useState } from "react";
import { COLORS, FONTS, MOCK_COLLECTION, LEADERBOARD, TOPICS, diffColor, diffBg } from "../constants";
import { GameLayout, Panel, Label, Divider, ActionBtn, TopicTag, DiffTag, FilterChip, PlayerChip, QuestionRow } from "../components/UI";

// ── LOBBY ──────────────────────────────────────────────────────────────────
function BigButton({ onClick, label, sub, icon, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? accent : "transparent", border: `2px solid ${accent}`, borderRadius: 4, padding: "28px 48px", color: COLORS.text, cursor: "pointer", transition: "all 0.15s", textAlign: "center", minWidth: 220, transform: hov ? "translateY(-2px)" : "none" }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: hov ? "rgba(255,255,255,0.7)" : COLORS.textMuted, marginTop: 4 }}>{sub}</div>
    </button>
  );
}

function NavPill({ onClick, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? COLORS.card : "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: "10px 24px", color: hov ? COLORS.text : COLORS.textMuted, cursor: "pointer", fontSize: 12, letterSpacing: 3, fontFamily: "'Space Mono', monospace", transition: "all 0.15s" }}
    >
      {label}
    </button>
  );
}

function LobbyScreen({ onNav }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48, fontFamily: "'Space Mono', monospace" }}>
      <style>{FONTS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 8, color: COLORS.textMuted, marginBottom: 12 }}>COMPETITIVE CODING</div>
        <div style={{ fontSize: 56, fontFamily: "'Orbitron', sans-serif", fontWeight: 900, color: COLORS.text, lineHeight: 1, letterSpacing: -1 }}>
          CODE<span style={{ color: COLORS.accentGlow }}>CLASH</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: COLORS.textMuted, letterSpacing: 2 }}>BATTLE · COLLECT · DOMINATE</div>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <BigButton onClick={() => onNav("room-create")} label="CREATE ROOM" sub="Host a battle" icon="⬡" accent={COLORS.accent} />
        <BigButton onClick={() => onNav("room-join")}   label="JOIN ROOM"   sub="Enter a code"  icon="⬢" accent={COLORS.blue}   />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <NavPill onClick={() => onNav("gacha")}       label="GACHA"       />
        <NavPill onClick={() => onNav("collection")}  label="COLLECTION"  />
        <NavPill onClick={() => onNav("deckbuilder")} label="DECKBUILDER" />
        <NavPill onClick={() => onNav("leaderboard")} label="LEADERBOARD" />
      </div>
    </div>
  );
}

// ── ROOM CREATE ────────────────────────────────────────────────────────────
function RoomCreateScreen({ onNav }) {
  const roomCode = "XK-4729";
  return (
    <GameLayout title="CREATE ROOM" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <Panel>
          <Label>YOUR ROOM CODE</Label>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 48, fontWeight: 900, color: COLORS.accentGlow, letterSpacing: 12 }}>
              {roomCode}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>Share this code with your opponent</div>
          </div>
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <PlayerChip name="You"      status="HOST"    color={COLORS.accent}  />
            <div style={{ color: COLORS.textMuted, fontSize: 20 }}>VS</div>
            <PlayerChip name="Waiting…" status="JOINING" color={COLORS.textDim} pulse />
          </div>
          <Divider />
          <div style={{ paddingTop: 16 }}>
            <ActionBtn onClick={() => onNav("pick-questions")} label="CONTINUE TO DECK PICK →" accent={COLORS.accent} disabled />
            <div style={{ textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>Waiting for opponent to join</div>
          </div>
        </Panel>
      </div>
    </GameLayout>
  );
}

// ── ROOM JOIN ──────────────────────────────────────────────────────────────
function RoomJoinScreen({ onNav }) {
  const [code, setCode] = useState("");
  return (
    <GameLayout title="JOIN ROOM" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <Panel>
          <Label>ENTER ROOM CODE</Label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="XX-0000"
            maxLength={7}
            style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "16px 20px", color: COLORS.text, fontSize: 32, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: 8, textAlign: "center", marginTop: 16, marginBottom: 16, boxSizing: "border-box" }}
          />
          <ActionBtn onClick={() => onNav("pick-questions")} label="JOIN →" accent={COLORS.blue} disabled={code.length < 7} />
        </Panel>
      </div>
    </GameLayout>
  );
}

// ── QUESTION PICKER ────────────────────────────────────────────────────────
function QuotaBadge({ diff, count, max }) {
  const done = count >= max;
  return (
    <div style={{ background: done ? diffBg[diff] : COLORS.card, border: `1px solid ${done ? diffColor[diff] : COLORS.border}`, borderRadius: 4, padding: "8px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ color: diffColor[diff], textTransform: "uppercase", letterSpacing: 2 }}>{diff}</span>
      <span style={{ color: done ? diffColor[diff] : COLORS.textMuted }}>{count}/{max}</span>
    </div>
  );
}

function QuestionPickScreen({ onNav }) {
  const [picks, setPicks] = useState([]);
  const quotas = { easy: 3, medium: 3, hard: 2 };
  const owned = MOCK_COLLECTION.filter(q => q.owned);
  const totalNeeded = 8;

  const count = (diff) => picks.filter(id => owned.find(q => q.id === id)?.diff === diff).length;
  const toggle = (id) => {
    const q = owned.find(q => q.id === id);
    if (picks.includes(id)) { setPicks(picks.filter(x => x !== id)); return; }
    if (count(q.diff) < quotas[q.diff]) setPicks([...picks, id]);
  };

  return (
    <GameLayout title="PICK YOUR DECK" onBack={() => onNav("room-create")}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(quotas).map(([d, n]) => (
            <QuotaBadge key={d} diff={d} count={count(d)} max={n} />
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textMuted }}>
            <span style={{ color: COLORS.text, fontWeight: 700 }}>{picks.length}</span>/{totalNeeded} selected
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {owned.map(q => (
            <QuestionRow key={q.id} q={q} selected={picks.includes(q.id)} onToggle={() => toggle(q.id)} disabled={!picks.includes(q.id) && count(q.diff) >= quotas[q.diff]} />
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <ActionBtn onClick={() => onNav("battle")} label="READY UP →" accent={COLORS.accent} disabled={picks.length !== totalNeeded} />
        </div>
      </div>
    </GameLayout>
  );
}

// ── RESULTS ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "20px 24px", flex: 1 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

function ResultsScreen({ onNav }) {
  const won = true;
  return (
    <GameLayout title="BATTLE COMPLETE" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 64, fontWeight: 900, color: won ? COLORS.gold : COLORS.red, marginBottom: 8 }}>
          {won ? "VICTORY" : "DEFEAT"}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, letterSpacing: 4, marginBottom: 32 }}>
          {won ? "DOMINANT PERFORMANCE" : "BETTER LUCK NEXT TIME"}
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 32 }}>
          <StatCard label="YOUR SCORE" value="650"  color={COLORS.accentGlow} />
          <StatCard label="OPP SCORE"  value="480"  color={COLORS.red}        />
          <StatCard label="TIME"       value="3:41" color={COLORS.gold}       />
        </div>
        <ActionBtn onClick={() => onNav("lobby")} label="BACK TO LOBBY" accent={COLORS.accent} />
      </div>
    </GameLayout>
  );
}

// ── GACHA ──────────────────────────────────────────────────────────────────
function GachaScreen({ onNav }) {
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState([]);
  const [packType, setPackType] = useState("standard");

  const packs = {
    standard:  { name: "STANDARD PACK",  cost: "100 coins", color: COLORS.blue,   cards: 5, desc: "Common / Uncommon cards"          },
    premium:   { name: "PREMIUM PACK",   cost: "250 coins", color: COLORS.accent, cards: 5, desc: "Guaranteed 1 Hard question"        },
    legendary: { name: "LEGENDARY PACK", cost: "500 coins", color: COLORS.gold,   cards: 3, desc: "Guaranteed rare questions"         },
  };

  const openPack = () => {
    setOpening(true);
    setRevealed([]);
    const diffs =
      packType === "legendary" ? ["hard", "hard", "hard"] :
      packType === "premium"   ? ["easy", "medium", "medium", "medium", "hard"] :
                                 ["easy", "easy", "medium", "medium", Math.random() > 0.7 ? "hard" : "easy"];

    diffs.forEach((diff, i) => {
      const pool = MOCK_COLLECTION.filter(q => q.diff === diff);
      const q = pool[Math.floor(Math.random() * pool.length)];
      setTimeout(() => setRevealed(r => [...r, q]), i * 400 + 500);
    });
    setTimeout(() => setOpening(false), diffs.length * 400 + 600);
  };

  const p = packs[packType];

  return (
    <GameLayout title="GACHA" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {Object.entries(packs).map(([k, v]) => (
            <button key={k} onClick={() => { setPackType(k); setRevealed([]); }}
              style={{ flex: 1, background: packType === k ? COLORS.card : "transparent", border: `2px solid ${packType === k ? v.color : COLORS.border}`, borderRadius: 4, padding: "16px 12px", cursor: "pointer", color: packType === k ? v.color : COLORS.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 1, transition: "all 0.15s" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{v.name}</div>
              <div style={{ fontSize: 10 }}>{v.cost}</div>
            </button>
          ))}
        </div>
        <Panel>
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>📦</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: p.color }}>{p.name}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{p.desc} · {p.cards} cards</div>
            <div style={{ marginTop: 24 }}>
              <ActionBtn onClick={openPack} label={opening ? "OPENING…" : `OPEN PACK · ${p.cost}`} accent={p.color} disabled={opening} />
            </div>
          </div>
        </Panel>
        {revealed.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Label>CARDS REVEALED</Label>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {revealed.map((q, i) => (
                <div key={i} style={{ background: diffBg[q.diff], border: `1px solid ${diffColor[q.diff]}`, borderRadius: 4, padding: 16, animation: "slideIn 0.3s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ fontSize: 13, color: COLORS.text, flex: 1 }}>{q.q}</div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <TopicTag topic={q.topic} />
                      <DiffTag diff={q.diff} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </GameLayout>
  );
}

// ── DECKBUILDER ────────────────────────────────────────────────────────────
function DeckbuilderScreen({ onNav }) {
  const [deck, setDeck] = useState([]);
  const owned = MOCK_COLLECTION.filter(q => q.owned);

  const toggle = (id) => {
    if (deck.includes(id)) { setDeck(deck.filter(x => x !== id)); return; }
    if (deck.length < 8) setDeck([...deck, id]);
  };

  const deckCards  = deck.map(id => owned.find(q => q.id === id));
  const topicCounts = {};
  deckCards.forEach(q => { if (q) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1; });

  return (
    <GameLayout title="DECKBUILDER" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div>
          <Label>CARD POOL</Label>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {owned.map(q => (
              <QuestionRow key={q.id} q={q} selected={deck.includes(q.id)} onToggle={() => toggle(q.id)} disabled={!deck.includes(q.id) && deck.length >= 8} />
            ))}
          </div>
        </div>
        <div>
          <Label>DECK ({deck.length}/8)</Label>
          <Panel style={{ marginTop: 12 }}>
            {deck.length === 0 && (
              <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", padding: "24px 0" }}>Add cards from the pool</div>
            )}
            {deckCards.map((q, i) => q && (
              <div key={i} onClick={() => toggle(q.id)} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.q}</div>
                <DiffTag diff={q.diff} />
              </div>
            ))}
            {Object.keys(topicCounts).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 3, marginBottom: 8 }}>TOPIC MIX</div>
                {Object.entries(topicCounts).map(([t, n]) => (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t}</div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {Array(n).fill(0).map((_, i) => <div key={i} style={{ width: 8, height: 8, background: COLORS.accent, borderRadius: 1 }} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <ActionBtn onClick={() => onNav("lobby")} label="SAVE DECK" accent={COLORS.accent} disabled={deck.length < 8} />
            </div>
          </Panel>
        </div>
      </div>
    </GameLayout>
  );
}

// ── LEADERBOARD ────────────────────────────────────────────────────────────
function LeaderboardScreen({ onNav }) {
  return (
    <GameLayout title="LEADERBOARD" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 8 }}>
          {LEADERBOARD.map(p => (
            <div key={p.rank} style={{ background: p.isMe ? COLORS.accentDim : COLORS.card, border: `1px solid ${p.isMe ? COLORS.accentGlow : p.rank <= 3 ? diffColor[["easy","medium","hard"][p.rank - 1]] : COLORS.border}`, borderRadius: 4, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: p.rank <= 3 ? 24 : 16, fontWeight: 900, color: p.rank === 1 ? COLORS.gold : p.rank === 2 ? "#94a3b8" : p.rank === 3 ? "#b45309" : COLORS.textMuted, width: 32, textAlign: "center" }}>
                {p.rank <= 3 ? ["🥇","🥈","🥉"][p.rank - 1] : `#${p.rank}`}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: p.isMe ? COLORS.accent : COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.text, flexShrink: 0 }}>
                {p.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 700 }}>
                  {p.name} {p.isMe && <span style={{ fontSize: 10, color: COLORS.accentGlow, letterSpacing: 2 }}>YOU</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: p.rank === 1 ? COLORS.gold : COLORS.text }}>{p.wins}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 2 }}>WINS</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}

// ── EXPORTS ────────────────────────────────────────────────────────────────
export { LobbyScreen, RoomCreateScreen, RoomJoinScreen, QuestionPickScreen, ResultsScreen, GachaScreen, DeckbuilderScreen, LeaderboardScreen };

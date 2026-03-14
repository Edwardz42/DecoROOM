import { useState, useEffect } from "react";
import { COLORS, FONTS, MOCK_COLLECTION, normaliseQuestion } from "../constants";
import { GameLayout, Panel, Label, Divider, ActionBtn, TopicTag, DiffTag, PlayerChip, QuestionRow } from "../components/UI";

const MONO = "'JetBrains Mono', monospace";

function getUnlockedIds() {
  try {
    return JSON.parse(localStorage.getItem("unlockedQuestionIds") || "[]");
  } catch {
    return [];
  }
}

function saveUnlockedIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  localStorage.setItem("unlockedQuestionIds", JSON.stringify(unique));
}

function formatMs(ms) {
  if (!ms || Number.isNaN(ms)) return "--:--";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ── LOBBY ──────────────────────────────────────────────────────────────────
function BigButton({ onClick, label, sub, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "rgba(74,144,226,0.12)" : "transparent", border: `1px solid ${hov ? accent : "rgba(74,144,226,0.35)"}`, borderRadius: 6, padding: "28px 52px", color: COLORS.text, cursor: "pointer", transition: "all 0.18s", textAlign: "center", minWidth: 220, boxShadow: hov ? "0 0 28px rgba(74,144,226,0.3)" : "none", transform: hov ? "translateY(-3px)" : "none" }}
    >
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 17, letterSpacing: 3, textTransform: "uppercase", color: hov ? accent : COLORS.text }}>{label}</div>
      <div style={{ fontSize: 11, color: hov ? "rgba(255,255,255,0.65)" : COLORS.textMuted, marginTop: 6, letterSpacing: 1 }}>{sub}</div>
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
      style={{ background: "none", border: "none", color: hov ? COLORS.accent : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.82rem", letterSpacing: 3, fontFamily: MONO, transition: "color 0.15s", textTransform: "uppercase", padding: "6px 0" }}
    >
      {label}
    </button>
  );
}

function LobbyScreen({ onNav }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgGrad, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 52, fontFamily: MONO }}>
      <style>{FONTS}</style>
      <div style={{ textAlign: "center", userSelect: "none" }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: 8, color: COLORS.textMuted, marginBottom: 16, textTransform: "uppercase" }}>Competitive Coding</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
          <span style={{ fontWeight: 800, fontSize: "clamp(2.8rem,8vw,5rem)", color: COLORS.accent, textShadow: "0 0 30px rgba(74,144,226,0.5)" }}>&lt;CS&gt;</span>
          <span style={{ fontWeight: 400, fontSize: "clamp(2.8rem,8vw,5rem)", color: COLORS.text, letterSpacing: 4, marginLeft: 12 }}>GACHA!</span>
        </div>
        <div style={{ marginTop: 10, fontSize: "0.75rem", color: COLORS.textMuted, letterSpacing: 4 }}>BATTLE · COLLECT · DOMINATE</div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <BigButton onClick={() => onNav("room-create")} label="Create Room" sub="Host a 1v1 battle" accent={COLORS.accent} />
        <BigButton onClick={() => onNav("room-join")} label="Join Room" sub="Enter invite code" accent={COLORS.accent} />
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
        <NavPill onClick={() => onNav("gacha")} label="Gacha" />
        <NavPill onClick={() => onNav("collection")} label="Collection" />
        <NavPill onClick={() => onNav("deckbuilder")} label="Deckbuilder" />
        <NavPill onClick={() => onNav("leaderboard")} label="Leaderboard" />
      </div>
    </div>
  );
}

// ── PLAYER + ROOM HELPERS ────────────────────────────────────────────────
async function ensurePlayer() {
  let playerId = localStorage.getItem("playerId");
  if (!playerId) {
    const r = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: `Player_${Math.random().toString(36).slice(2, 8)}` }),
    });
    const p = await r.json();
    playerId = p.id;
    localStorage.setItem("playerId", playerId);
    localStorage.setItem("username", p.username || "You");
  }
  return playerId;
}

// ── ROOM CREATE ───────────────────────────────────────────────────────────
function RoomCreateScreen({ onNav }) {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestJoined, setGuestJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const playerId = await ensurePlayer();
        const r = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostPlayerId: playerId }),
        });
        const room = await r.json();
        if (!room.id) {
          setError(room.error || "Failed to create room");
        } else {
          setRoomCode(room.id);
          localStorage.setItem("roomId", room.id);
          localStorage.setItem("roomRole", "host");
        }
      } catch {
        setError("Could not connect to server. Is backend running?");
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/rooms/${roomCode}`);
        const room = await r.json();
        if (room.guestPlayerId) {
          setGuestJoined(true);
          clearInterval(poll);
        }
      } catch {}
    }, 1500);
    return () => clearInterval(poll);
  }, [roomCode]);

  return (
    <GameLayout title="CREATE ROOM" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <Panel>
          <Label>Your Room Code</Label>
          <div style={{ textAlign: "center", padding: "36px 0 24px" }}>
            {loading ? (
              <div style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: MONO, letterSpacing: 2 }}>Creating room...</div>
            ) : error ? (
              <div style={{ fontSize: 13, color: COLORS.red, fontFamily: MONO }}>{error}</div>
            ) : (
              <>
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 52, color: COLORS.accent, letterSpacing: 14, textShadow: "0 0 24px rgba(74,144,226,0.5)" }}>{roomCode}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10, letterSpacing: 2 }}>Share this code with your opponent</div>
              </>
            )}
          </div>
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
            <PlayerChip name="You" status="HOST" color={COLORS.accent} />
            <div style={{ color: COLORS.textMuted, fontSize: "0.7rem", letterSpacing: 4, fontFamily: MONO }}>VS</div>
            <PlayerChip name={guestJoined ? "Opponent" : "Waiting..."} status={guestJoined ? "JOINED" : "JOINING"} color={guestJoined ? COLORS.green : COLORS.textDim} pulse={!guestJoined} />
          </div>
          <Divider />
          <div style={{ paddingTop: 12 }}>
            <ActionBtn onClick={() => onNav("pick-questions")} label="Continue to Deck Pick ->" accent={COLORS.accent} disabled={!guestJoined} flex />
          </div>
        </Panel>
      </div>
    </GameLayout>
  );
}

// ── ROOM JOIN ─────────────────────────────────────────────────────────────
function RoomJoinScreen({ onNav }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinRoom = async () => {
    if (code.length < 8) return;
    setLoading(true);
    setError(null);
    try {
      const playerId = await ensurePlayer();
      const r = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestPlayerId: playerId }),
      });
      const room = await r.json();
      if (!room.id) {
        setError(room.error || "Could not join room");
      } else {
        localStorage.setItem("roomId", room.id);
        localStorage.setItem("roomRole", "guest");
        onNav("pick-questions");
      }
    } catch {
      setError("Could not connect to server. Is backend running?");
    }
    setLoading(false);
  };

  return (
    <GameLayout title="JOIN ROOM" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <Panel>
          <Label>Enter Room Code</Label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX"
            maxLength={8}
            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "18px 20px", color: COLORS.accent, fontSize: 36, fontFamily: MONO, fontWeight: 800, letterSpacing: 10, textAlign: "center", marginTop: 18, marginBottom: 16, boxSizing: "border-box", outline: "none", caretColor: COLORS.accent }}
          />
          {error && <div style={{ fontSize: "0.7rem", color: COLORS.red, marginBottom: 12, fontFamily: MONO }}>{error}</div>}
          <ActionBtn onClick={joinRoom} label={loading ? "Joining..." : "Join ->"} accent={COLORS.accent} disabled={code.length < 8 || loading} flex />
        </Panel>
      </div>
    </GameLayout>
  );
}

// ── QUESTION PICKER ───────────────────────────────────────────────────────
function QuotaBadge({ diff, count, max }) {
  const palette = {
    easy: COLORS.green,
    medium: COLORS.gold,
    hard: COLORS.red,
  };
  const done = count >= max;
  return (
    <div style={{ background: done ? "rgba(74,144,226,0.10)" : "rgba(13,26,45,0.7)", border: `1px solid ${done ? palette[diff] : COLORS.border}`, borderRadius: 4, padding: "8px 18px", fontSize: "0.65rem", fontFamily: MONO, display: "flex", gap: 10, alignItems: "center", letterSpacing: 2 }}>
      <span style={{ color: palette[diff], textTransform: "uppercase" }}>{diff}</span>
      <span style={{ color: done ? palette[diff] : COLORS.textMuted }}>{count}/{max}</span>
    </div>
  );
}

function QuestionPickScreen({ onNav }) {
  const [picks, setPicks] = useState([]);
  const [pool, setPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const quotas = { easy: 3, medium: 3, hard: 2 };
  const totalNeeded = 8;

  useEffect(() => {
    const unlocked = new Set(getUnlockedIds());
    fetch("/api/gacha/questions")
      .then(r => r.json())
      .then(qs => {
        const normal = qs.map(normaliseQuestion);
        const unlockedPool = normal.filter(q => unlocked.has(q.id));
        setPool(unlockedPool);
      })
      .catch(() => setPool(MOCK_COLLECTION.filter(q => q.owned)))
      .finally(() => setLoadingPool(false));
  }, []);

  const count = (diff) => picks.filter(id => pool.find(q => q.id === id)?.diff === diff).length;

  const toggle = (id) => {
    const q = pool.find(x => x.id === id);
    if (!q) return;
    if (picks.includes(id)) {
      setPicks(picks.filter(x => x !== id));
      return;
    }
    if (count(q.diff) < quotas[q.diff]) {
      setPicks([...picks, id]);
    }
  };

  const readyUp = async () => {
    setSubmitting(true);
    setError("");
    try {
      const roomId = localStorage.getItem("roomId");
      const playerId = localStorage.getItem("playerId");
      if (!roomId || !playerId) throw new Error("Missing room/player session");

      const deckRes = await fetch(`/api/rooms/${roomId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, questionIds: picks }),
      });
      const deckJson = await deckRes.json();
      if (!deckRes.ok || deckJson.error) throw new Error(deckJson.error || "Failed to submit deck");

      const readyRes = await fetch(`/api/rooms/${roomId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ready: true }),
      });
      const readyJson = await readyRes.json();
      if (!readyRes.ok || readyJson.error) throw new Error(readyJson.error || "Failed to ready up");

      onNav("room-ready");
    } catch (e) {
      setError(e.message || "Failed to ready up");
    }
    setSubmitting(false);
  };

  const notEnoughUnlocked = !loadingPool && pool.length < 8;

  return (
    <GameLayout title="PICK YOUR DECK" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(quotas).map(([d, n]) => (
            <QuotaBadge key={d} diff={d} count={count(d)} max={n} />
          ))}
          <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: COLORS.textMuted, fontFamily: MONO }}>
            <span style={{ color: COLORS.text, fontWeight: 800 }}>{picks.length}</span>/{totalNeeded} selected
          </div>
        </div>

        {notEnoughUnlocked && (
          <Panel style={{ marginBottom: 14, borderColor: COLORS.red }}>
            <div style={{ color: COLORS.red, fontFamily: MONO, fontSize: "0.72rem", letterSpacing: 1 }}>
              You need at least 8 unlocked questions to battle. Open packs in Gacha first.
            </div>
          </Panel>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {loadingPool ? (
            <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontFamily: MONO, padding: "24px 0", letterSpacing: 2 }}>Loading unlocked questions...</div>
          ) : pool.map(q => (
            <QuestionRow key={q.id} q={q} selected={picks.includes(q.id)} onToggle={() => toggle(q.id)} disabled={!picks.includes(q.id) && count(q.diff) >= quotas[q.diff]} />
          ))}
        </div>

        {error && <div style={{ marginTop: 10, color: COLORS.red, fontFamily: MONO, fontSize: "0.72rem" }}>{error}</div>}

        <div style={{ marginTop: 20 }}>
          <ActionBtn onClick={readyUp} label={submitting ? "Submitting..." : "Ready Up ->"} accent={COLORS.accent} disabled={picks.length !== totalNeeded || submitting || notEnoughUnlocked} flex />
        </div>
      </div>
    </GameLayout>
  );
}

// ── READY ROOM / HOST START ───────────────────────────────────────────────
function RoomReadyScreen({ onNav }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const roomId = localStorage.getItem("roomId");
  const playerId = localStorage.getItem("playerId");

  const refresh = async () => {
    if (!roomId) return;
    try {
      const r = await fetch(`/api/rooms/${roomId}`);
      const data = await r.json();
      setRoom(data);

      if (data.status === "IN_GAME") {
        onNav("battle");
      }
      if (data.status === "FINISHED") {
        onNav("results");
      }
    } catch {
      setError("Unable to refresh room status");
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 1500);
    return () => clearInterval(poll);
  }, []);

  const setReady = async (ready) => {
    try {
      await fetch(`/api/rooms/${roomId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ready }),
      });
      refresh();
    } catch {
      setError("Failed to change ready state");
    }
  };

  const startRoom = async () => {
    setStarting(true);
    setError("");
    try {
      const r = await fetch(`/api/game/${roomId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterPlayerId: playerId }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || "Failed to start room");
      onNav("battle");
    } catch (e) {
      setError(e.message || "Failed to start room");
    }
    setStarting(false);
  };

  if (loading) {
    return (
      <GameLayout title="READY ROOM" onBack={() => onNav("lobby")}>
        <div style={{ color: COLORS.textMuted, fontFamily: MONO }}>Loading room...</div>
      </GameLayout>
    );
  }

  if (!room) {
    return (
      <GameLayout title="READY ROOM" onBack={() => onNav("lobby")}>
        <div style={{ color: COLORS.red, fontFamily: MONO }}>Room not found.</div>
      </GameLayout>
    );
  }

  const isHost = room.hostPlayerId === playerId;
  const hostReady = room.playersReady?.[room.hostPlayerId] === true;
  const guestReady = room.guestPlayerId ? room.playersReady?.[room.guestPlayerId] === true : false;
  const hostDeckReady = (room.submittedQuestionSets?.[room.hostPlayerId] || []).length === 8;
  const guestDeckReady = room.guestPlayerId ? (room.submittedQuestionSets?.[room.guestPlayerId] || []).length === 8 : false;
  const canStart = !!room.guestPlayerId && hostReady && guestReady && hostDeckReady && guestDeckReady;
  const meReady = room.playersReady?.[playerId] === true;

  return (
    <GameLayout title="READY ROOM" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Panel>
          <Label>Room Code</Label>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 44, letterSpacing: 10, color: COLORS.accent, marginTop: 10 }}>{room.id}</div>
          <Divider />

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.75rem", color: COLORS.text }}>
              <span>Host deck submitted</span><span style={{ color: hostDeckReady ? COLORS.green : COLORS.red }}>{hostDeckReady ? "YES" : "NO"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.75rem", color: COLORS.text }}>
              <span>Guest deck submitted</span><span style={{ color: guestDeckReady ? COLORS.green : COLORS.red }}>{guestDeckReady ? "YES" : "NO"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.75rem", color: COLORS.text }}>
              <span>Host ready</span><span style={{ color: hostReady ? COLORS.green : COLORS.red }}>{hostReady ? "YES" : "NO"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.75rem", color: COLORS.text }}>
              <span>Guest ready</span><span style={{ color: guestReady ? COLORS.green : COLORS.red }}>{guestReady ? "YES" : "NO"}</span>
            </div>
          </div>

          <Divider />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionBtn onClick={() => setReady(!meReady)} label={meReady ? "Unready" : "Ready"} accent={meReady ? COLORS.gold : COLORS.accent} />
            {isHost ? (
              <ActionBtn onClick={startRoom} label={starting ? "Starting..." : "Start Room"} accent={COLORS.green} disabled={!canStart || starting} />
            ) : (
              <div style={{ color: COLORS.textMuted, fontFamily: MONO, fontSize: "0.72rem", alignSelf: "center" }}>Waiting for host to start...</div>
            )}
          </div>

          {!canStart && (
            <div style={{ marginTop: 10, color: COLORS.textMuted, fontFamily: MONO, fontSize: "0.7rem" }}>
              Both players must submit 8-card decks and ready up before starting.
            </div>
          )}

          {error && <div style={{ marginTop: 10, color: COLORS.red, fontFamily: MONO, fontSize: "0.72rem" }}>{error}</div>}
        </Panel>
      </div>
    </GameLayout>
  );
}

// ── RESULTS ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "rgba(13,26,45,0.85)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "22px 28px", flex: 1, backdropFilter: "blur(4px)" }}>
      <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 3, marginBottom: 10, fontFamily: MONO, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 28, color }}>{value}</div>
    </div>
  );
}

function ResultsScreen({ onNav }) {
  const my = Number(localStorage.getItem("lastScore") || 0);
  const opp = Number(localStorage.getItem("lastOppScore") || 0);
  const time = localStorage.getItem("lastTime") || "--:--";
  const winnerId = localStorage.getItem("lastWinnerPlayerId");
  const playerId = localStorage.getItem("playerId");
  const won = winnerId ? winnerId === playerId : my >= opp;

  return (
    <GameLayout title="BATTLE COMPLETE" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: "clamp(3rem,10vw,5rem)", color: won ? COLORS.gold : COLORS.red, marginBottom: 8, textShadow: `0 0 30px ${won ? "rgba(241,250,140,0.5)" : "rgba(255,85,85,0.5)"}` }}>{won ? "VICTORY" : "DEFEAT"}</div>
        <div style={{ fontSize: "0.65rem", color: COLORS.textMuted, letterSpacing: 4, marginBottom: 36, fontFamily: MONO }}>{won ? "MOST POINTS / FASTEST TIME" : "BETTER LUCK NEXT BATTLE"}</div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 36 }}>
          <StatCard label="Your Score" value={my} color={COLORS.accent} />
          <StatCard label="Opp Score" value={opp} color={COLORS.red} />
          <StatCard label="Time Left" value={time} color={COLORS.gold} />
        </div>
        <ActionBtn onClick={() => onNav("lobby")} label="Back to Lobby" accent={COLORS.accent} flex />
      </div>
    </GameLayout>
  );
}

// ── GACHA ─────────────────────────────────────────────────────────────────
function GachaScreen({ onNav }) {
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState([]);

  const openPack = async () => {
    setOpening(true);
    setRevealed([]);

    try {
      const playerId = localStorage.getItem("playerId") || "anonymous";
      const r = await fetch("/api/gacha/open-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await r.json();
      const cards = (data.pack || []).map(normaliseQuestion);

      const unlocked = getUnlockedIds();
      saveUnlockedIds([...unlocked, ...cards.map(c => c.id)]);

      cards.forEach((q, i) => {
        setTimeout(() => setRevealed(prev => [...prev, q]), i * 320 + 300);
      });
    } catch {
      const pool = [...MOCK_COLLECTION].sort(() => Math.random() - 0.5).slice(0, 8);
      const unlocked = getUnlockedIds();
      saveUnlockedIds([...unlocked, ...pool.map(c => c.id)]);
      pool.forEach((q, i) => {
        setTimeout(() => setRevealed(prev => [...prev, q]), i * 320 + 300);
      });
    }

    setTimeout(() => setOpening(false), 8 * 320 + 400);
  };

  return (
    <GameLayout title="GACHA" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Panel style={{ textAlign: "center", padding: "36px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>📦</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 20, color: COLORS.accent, letterSpacing: 4, marginBottom: 6 }}>QUESTION PACK</div>
          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, letterSpacing: 2, marginBottom: 28 }}>Harder cards are rarer. Pull to unlock your battle deck.</div>
          <ActionBtn onClick={openPack} label={opening ? "Opening..." : "Open Pack"} accent={COLORS.accent} disabled={opening} />
        </Panel>

        {revealed.length > 0 && (
          <>
            <Label>Cards Revealed ({revealed.length})</Label>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {revealed.map((q, i) => (
                <div key={i} style={{ background: "rgba(13,26,45,0.75)", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, animation: "cardSlide 0.35s ease" }}>
                  <div style={{ flex: 1, fontSize: "0.82rem", color: COLORS.text, fontFamily: MONO, lineHeight: 1.5 }}>{q.q}</div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
                    <TopicTag topic={q.topic} />
                    <DiffTag diff={q.diff} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{"@keyframes cardSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}"}</style>
    </GameLayout>
  );
}

// ── DECKBUILDER ───────────────────────────────────────────────────────────
function DeckbuilderScreen({ onNav }) {
  const [deck, setDeck] = useState([]);
  const [pool, setPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);

  useEffect(() => {
    const unlocked = new Set(getUnlockedIds());
    fetch("/api/gacha/questions")
      .then(r => r.json())
      .then(qs => setPool(qs.map(normaliseQuestion).filter(q => unlocked.has(q.id))))
      .catch(() => setPool(MOCK_COLLECTION.filter(q => q.owned)))
      .finally(() => setLoadingPool(false));
  }, []);

  const toggle = (id) => {
    if (deck.includes(id)) {
      setDeck(deck.filter(x => x !== id));
      return;
    }
    if (deck.length < 8) setDeck([...deck, id]);
  };

  const deckCards = deck.map(id => pool.find(q => q.id === id)).filter(Boolean);
  const topicCounts = {};
  deckCards.forEach(q => {
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  });

  return (
    <GameLayout title="DECKBUILDER" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        <div>
          <Label>Unlocked Pool ({pool.length})</Label>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {loadingPool ? (
              <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontFamily: MONO, padding: "24px 0", letterSpacing: 2 }}>Loading unlocked cards...</div>
            ) : pool.length === 0 ? (
              <Panel><div style={{ color: COLORS.textMuted, fontFamily: MONO, fontSize: "0.7rem" }}>No unlocked cards yet. Open packs in Gacha.</div></Panel>
            ) : pool.map(q => (
              <QuestionRow key={q.id} q={q} selected={deck.includes(q.id)} onToggle={() => toggle(q.id)} disabled={!deck.includes(q.id) && deck.length >= 8} />
            ))}
          </div>
        </div>

        <div>
          <Label>Deck ({deck.length}/8)</Label>
          <Panel style={{ marginTop: 12 }}>
            {deck.length === 0 ? (
              <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textAlign: "center", padding: "28px 0", fontFamily: MONO, letterSpacing: 2 }}>Add cards from your unlocked pool</div>
            ) : deckCards.map((q, i) => (
              <div key={i} onClick={() => toggle(q.id)} style={{ padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, fontFamily: MONO, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.q}</div>
                <DiffTag diff={q.diff} />
              </div>
            ))}

            {Object.keys(topicCounts).length > 0 && (
              <div style={{ marginTop: 18 }}>
                <Label>Topic Mix</Label>
                <div style={{ marginTop: 10 }}>
                  {Object.entries(topicCounts).map(([t, n]) => (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: "0.65rem", color: COLORS.textMuted, fontFamily: MONO }}>{t}</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {Array(n).fill(0).map((_, idx) => <div key={idx} style={{ width: 8, height: 8, background: COLORS.accent, borderRadius: 2, boxShadow: `0 0 4px ${COLORS.accent}` }} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </GameLayout>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────
function LeaderboardScreen({ onNav }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players/leaderboard")
      .then(r => r.json())
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const me = localStorage.getItem("playerId");

  return (
    <GameLayout title="LEADERBOARD" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {loading ? (
          <div style={{ fontFamily: MONO, color: COLORS.textMuted }}>Loading leaderboard...</div>
        ) : rows.length === 0 ? (
          <Panel>
            <div style={{ fontFamily: MONO, color: COLORS.textMuted }}>No ranked players yet. Play matches to populate leaderboard.</div>
          </Panel>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((p) => {
              const isMe = p.id === me;
              const medal = p.rank <= 3 ? ["🥇", "🥈", "🥉"][p.rank - 1] : `#${p.rank}`;
              return (
                <div key={p.id} style={{ background: isMe ? COLORS.accentDim : "rgba(13,26,45,0.75)", border: `1px solid ${isMe ? COLORS.accent : COLORS.border}`, borderRadius: 6, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, backdropFilter: "blur(4px)" }}>
                  <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: p.rank <= 3 ? 22 : 14, color: p.rank === 1 ? COLORS.gold : p.rank === 2 ? "#94a3b8" : p.rank === 3 ? "#b45309" : COLORS.textMuted, width: 34, textAlign: "center" }}>{medal}</div>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: isMe ? COLORS.accent : "rgba(74,144,226,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: COLORS.text, flexShrink: 0, fontFamily: MONO }}>
                    {(p.username || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", color: COLORS.text, fontWeight: 800, fontFamily: MONO }}>
                      {p.username} {isMe && <span style={{ fontSize: "0.6rem", color: COLORS.accent, letterSpacing: 2 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: COLORS.textMuted, fontFamily: MONO }}>Matches: {p.matches} · Win rate: {Math.round((p.winRate || 0) * 100)}%</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 22, color: p.rank === 1 ? COLORS.gold : COLORS.text }}>{p.wins}</div>
                    <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, letterSpacing: 3, fontFamily: MONO }}>WINS</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GameLayout>
  );
}

export {
  LobbyScreen,
  RoomCreateScreen,
  RoomJoinScreen,
  QuestionPickScreen,
  RoomReadyScreen,
  ResultsScreen,
  GachaScreen,
  DeckbuilderScreen,
  LeaderboardScreen,
  formatMs,
};

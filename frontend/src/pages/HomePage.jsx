import { useState, useEffect } from "react";
import { COLORS, FONTS, MOCK_COLLECTION, normaliseQuestion } from "../constants";
import { GameLayout, Panel, Label, Divider, ActionBtn, TopicTag, DiffTag, PlayerChip, QuestionRow } from "../components/UI";
import { API_BASE } from "../apiBase";

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

function getDeckIds() {
  try {
    return JSON.parse(localStorage.getItem("selectedDeckIds") || "[]");
  } catch {
    return [];
  }
}

function saveDeckIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  localStorage.setItem("selectedDeckIds", JSON.stringify(unique));
}

function formatMs(ms) {
  if (!ms || Number.isNaN(ms)) return "--:--";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function emitGachaSoundHook(type, rarity = null, index = null) {
  // Hook point for external audio engine: listen to `window` event `gacha:sound`.
  window.dispatchEvent(new CustomEvent("gacha:sound", {
    detail: { type, rarity, index, at: Date.now() },
  }));
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
    const r = await fetch(`${API_BASE}/api/players`, {
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
  const [guestWaiting, setGuestWaiting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const playerId = await ensurePlayer();
        const r = await fetch(`${API_BASE}/api/rooms`, {
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
        }
        if (room.guestWaiting) {
          setGuestWaiting(true);
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
            <PlayerChip name={guestWaiting ? "Opponent (waiting)" : guestJoined ? "Opponent" : "Waiting..."} status={guestWaiting ? "WAITING" : guestJoined ? "JOINED" : "JOINING"} color={guestWaiting ? COLORS.gold : guestJoined ? COLORS.green : COLORS.textDim} pulse={!guestJoined} />
          </div>
          <Divider />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <button
              onClick={() => onNav("room-join")}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: "0.72rem",
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: 0,
              }}
            >
              Have a code instead? Join Room
            </button>
          </div>
          <div style={{ paddingTop: 12 }}>
            <ActionBtn
              onClick={async () => {
                const roomId = roomCode;
                try {
                  await fetch(`/api/rooms/${roomId}/hostReady`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ready: true })
                  });
                  onNav("pick-questions");
                } catch {
                  // Optionally show error
                }
              }}
              label="Continue to Deck Pick ->"
              accent={COLORS.accent}
              disabled={!guestJoined}
              flex
            />
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
      // Always create a new player for guest
      const rPlayer = await fetch(`${API_BASE}/api/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: `Player_${Math.random().toString(36).slice(2, 8)}` }),
      });
      const p = await rPlayer.json();
      const playerId = p.id;
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("username", p.username || "You");
      const r = await fetch(`${API_BASE}/api/rooms/${code}/join`, {
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
        onNav("room-wait");
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

// ── WAITING ROOM FOR GUEST ──────────────────────────────────────────────
function RoomWaitScreen({ onNav }) {
  const [hostReady, setHostReady] = useState(false);
  const [error, setError] = useState("");
  const roomId = localStorage.getItem("roomId");
  useEffect(() => {
    if (!roomId) return;
    // Signal to backend that guest is waiting
    fetch(`${API_BASE}/api/rooms/${roomId}/guestWaiting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waiting: true })
    });
  }, [roomId]);

  // Poll for hostReady
  useEffect(() => {
    if (!roomId) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/rooms/${roomId}`);
        const room = await r.json();
        if (room.hostReady) {
          setHostReady(true);
        }
      } catch {}
    }, 1500);
    return () => clearInterval(poll);
  }, [roomId]);

  useEffect(() => {
    if (hostReady) {
      onNav("pick-questions");
    }
  }, [hostReady, onNav]);

  return (
    <GameLayout title="WAITING FOR HOST" onBack={() => onNav("lobby")}> 
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <Panel>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 32, color: COLORS.accent, letterSpacing: 6, textAlign: "center", marginBottom: 18 }}>Waiting for host...</div>
          <div style={{ color: COLORS.textMuted, fontFamily: MONO, fontSize: "0.8rem", textAlign: "center" }}>Once the host continues, you'll proceed to deck building.</div>
          {error && <div style={{ color: COLORS.red, fontFamily: MONO, fontSize: "0.7rem", marginTop: 16 }}>{error}</div>}
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
  const [oppDeckReady, setOppDeckReady] = useState(false);
  const [oppName, setOppName] = useState("Opponent");
  const quotas = { easy: 3, medium: 3, hard: 2 };
  const totalNeeded = 8;

  useEffect(() => {
    const unlocked = new Set(getUnlockedIds());
    fetch(`${API_BASE}/api/gacha/questions`)
      .then(r => r.json())
      .then(qs => {
        const normal = qs.map(normaliseQuestion);
        const unlockedPool = normal.filter(q => unlocked.has(q.id));
        setPool(unlockedPool);
      })
      .catch(() => setPool(MOCK_COLLECTION.filter(q => q.owned)))
      .finally(() => setLoadingPool(false));
  }, []);

  // Poll for opponent deck submission
  useEffect(() => {
    const roomId = localStorage.getItem("roomId");
    const playerId = localStorage.getItem("playerId");
    if (!roomId || !playerId) return;
    let cancelled = false;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/rooms/${roomId}`);
        const room = await r.json();
        const isHost = room.hostPlayerId === playerId;
        const oppId = isHost ? room.guestPlayerId : room.hostPlayerId;
        if (oppId) {
          setOppDeckReady((room.submittedQuestionSets?.[oppId] || []).length === 8);
          setOppName(isHost ? "Guest" : "Host");
        }
      } catch {}
    }, 1500);
    return () => { cancelled = true; clearInterval(poll); };
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

      const deckRes = await fetch(`${API_BASE}/api/rooms/${roomId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, questionIds: picks }),
      });
      const deckJson = await deckRes.json();
      if (!deckRes.ok || deckJson.error) throw new Error(deckJson.error || "Failed to submit deck");

      const readyRes = await fetch(`${API_BASE}/api/rooms/${roomId}/ready`, {
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

        {oppDeckReady && (
          <Panel style={{ marginBottom: 14, borderColor: COLORS.green }}>
            <div style={{ color: COLORS.green, fontFamily: MONO, fontSize: "0.72rem", letterSpacing: 1 }}>
              {oppName} has submitted their deck!
            </div>
          </Panel>
        )}

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
  const [submittingDeck, setSubmittingDeck] = useState(false);

  const roomId = localStorage.getItem("roomId");
  const playerId = localStorage.getItem("playerId");
  const savedDeck = getDeckIds();

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

  const submitSavedDeck = async () => {
    if (savedDeck.length !== 8) {
      setError("Build and save an 8-card deck first in Collection/Deckbuilder.");
      return;
    }
    setSubmittingDeck(true);
    setError("");
    try {
      const r = await fetch(`/api/rooms/${roomId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, questionIds: savedDeck }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || "Failed to submit deck");
      await refresh();
    } catch (e) {
      setError(e.message || "Failed to submit deck");
    }
    setSubmittingDeck(false);
  };

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

  // Define these after room is confirmed
  const isHost = room.hostPlayerId === playerId;
  const myDeckReady = (room.submittedQuestionSets?.[playerId] || []).length === 8;
  const oppId = isHost ? room.guestPlayerId : room.hostPlayerId;
  const oppDeckReady = oppId ? (room.submittedQuestionSets?.[oppId] || []).length === 8 : false;

  const hostReady = room.playersReady?.[room.hostPlayerId] === true;
  const guestReady = room.guestPlayerId ? room.playersReady?.[room.guestPlayerId] === true : false;
  const canStart = !!room.guestPlayerId && hostReady && guestReady && myDeckReady && oppDeckReady;
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
              <span>Saved local deck</span><span style={{ color: savedDeck.length === 8 ? COLORS.green : COLORS.red }}>{savedDeck.length}/8</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.75rem", color: COLORS.text }}>
              <span>Your deck submitted</span><span style={{ color: myDeckReady ? COLORS.green : COLORS.red }}>{myDeckReady ? "YES" : "NO"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.75rem", color: COLORS.text }}>
              <span>Opponent deck submitted</span><span style={{ color: oppDeckReady ? COLORS.green : COLORS.red }}>{oppDeckReady ? "YES" : "NO"}</span>
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
            <ActionBtn onClick={submitSavedDeck} label={submittingDeck ? "Submitting Deck..." : "Submit Saved Deck"} accent={COLORS.accent} disabled={savedDeck.length !== 8 || submittingDeck} />
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
  const [packCards, setPackCards] = useState([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [revealed, setRevealed] = useState([]);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [starterClaimed, setStarterClaimed] = useState(localStorage.getItem("starterPackClaimed") === "1");
  const [showStarterBanner, setShowStarterBanner] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      const ts = Number(localStorage.getItem("lastPackOpenedAt") || 0);
      const left = Math.max(0, 60000 - (Date.now() - ts));
      setCooldownLeft(left);
    }, 250);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    // First-time experience: auto-open starter pack if user has no cards.
    const unlocked = getUnlockedIds();
    if (unlocked.length === 0 && !opening && revealed.length === 0 && packCards.length === 0) {
      openPack(true);
    }
  }, []);

  const openPack = async (isStarter = false) => {
    if (!isStarter && cooldownLeft > 0) return;
    setOpening(true);
    setFlippedCount(0);
    setPackCards([]);
    setRevealed([]);
    emitGachaSoundHook("pack-open", null, null);

    let cards = [];
    try {
      const playerId = localStorage.getItem("playerId") || "anonymous";
      const r = await fetch(`${API_BASE}/api/gacha/open-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await r.json();
      cards = (data.pack || []).map(normaliseQuestion);

      const unlocked = getUnlockedIds();
      saveUnlockedIds([...unlocked, ...cards.map(c => c.id)]);
    } catch {
      const pool = [...MOCK_COLLECTION].sort(() => Math.random() - 0.5).slice(0, 8);
      const unlocked = getUnlockedIds();
      saveUnlockedIds([...unlocked, ...pool.map(c => c.id)]);
      cards = pool;
    }

    setPackCards(cards);
    cards.forEach((q, i) => {
      setTimeout(() => {
        setFlippedCount(i + 1);
        setRevealed(cards.slice(0, i + 1));
        emitGachaSoundHook("card-flip", q.diff, i);
      }, i * 280 + 260);
    });

    if (isStarter && !starterClaimed) {
      localStorage.setItem("starterPackClaimed", "1");
      setStarterClaimed(true);
      setShowStarterBanner(true);
      setTimeout(() => setShowStarterBanner(false), 3800);
    }

    localStorage.setItem("lastPackOpenedAt", String(Date.now()));
    setTimeout(() => {
      setOpening(false);
      emitGachaSoundHook("pack-complete", null, null);
    }, 8 * 280 + 420);
  };

  const ringSize = 86;
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const cooldownProgress = Math.max(0, Math.min(1, cooldownLeft / 60000));
  const ringOffset = ringCircumference * (1 - (1 - cooldownProgress));

  return (
    <GameLayout title="GACHA" onBack={() => onNav("lobby")}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {showStarterBanner && (
          <div style={{ marginBottom: 12, padding: "10px 14px", border: `1px solid ${COLORS.green}`, background: "rgba(80,250,123,0.12)", borderRadius: 6, color: COLORS.green, fontFamily: MONO, fontSize: "0.72rem", letterSpacing: 2, textTransform: "uppercase" }}>
            Starter Pack Claimed - 8 cards unlocked
          </div>
        )}

        {starterClaimed && !showStarterBanner && (
          <div style={{ marginBottom: 12, padding: "10px 14px", border: `1px solid ${COLORS.border}`, background: "rgba(74,144,226,0.08)", borderRadius: 6, color: COLORS.accent, fontFamily: MONO, fontSize: "0.68rem", letterSpacing: 2, textTransform: "uppercase" }}>
            Starter Pack Claimed
          </div>
        )}

        <Panel style={{ textAlign: "center", padding: "36px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>📦</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 20, color: COLORS.accent, letterSpacing: 4, marginBottom: 6 }}>QUESTION PACK</div>
          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, letterSpacing: 2, marginBottom: 16 }}>Hard cards are rare. New pack every 60 seconds.</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <div style={{ position: "relative", width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="rgba(255,255,255,0.15)" strokeWidth="7" fill="none" />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke={cooldownLeft > 0 ? COLORS.gold : COLORS.green}
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.2s linear" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, color: cooldownLeft > 0 ? COLORS.gold : COLORS.green, fontSize: "0.72rem", fontWeight: 800 }}>
                {cooldownLeft > 0 ? `${Math.ceil(cooldownLeft / 1000)}s` : "READY"}
              </div>
            </div>
            <ActionBtn onClick={() => openPack(false)} label={opening ? "Opening..." : cooldownLeft > 0 ? "On Cooldown" : "Open Pack"} accent={COLORS.accent} disabled={opening || cooldownLeft > 0} />
          </div>
        </Panel>

        {packCards.length > 0 && (
          <>
            <Label>Cards Revealed ({revealed.length})</Label>
            <div style={{ position: "relative", height: 300, marginTop: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, background: "rgba(9, 14, 26, 0.72)", overflow: "hidden" }}>
              {packCards.map((q, i) => {
                const isFlipped = i < flippedCount;
                const col = i % 4;
                const row = Math.floor(i / 4);
                const rarityColor = q.diff === "hard" ? COLORS.red : q.diff === "medium" ? COLORS.gold : COLORS.green;

                const left = isFlipped ? `calc(4% + ${col * 24}%)` : `calc(50% - 72px + ${Math.min(i, 6) * 1.2}px)`;
                const top = isFlipped ? `${18 + row * 42}%` : `calc(50% - 56px - ${Math.min(i, 6) * 0.7}px)`;
                const rotate = isFlipped ? "rotateY(0deg)" : "rotateY(180deg)";

                return (
                  <div key={i} style={{ position: "absolute", width: 144, height: 108, left, top, transform: `${rotate} scale(${isFlipped ? 1 : 0.98})`, transformStyle: "preserve-3d", transition: `all 420ms cubic-bezier(0.2,0.9,0.2,1), transform 460ms ease ${i * 40}ms`, borderRadius: 7, border: `1px solid ${isFlipped ? rarityColor : "rgba(255,255,255,0.18)"}`, background: isFlipped ? `linear-gradient(140deg, ${rarityColor}25 0%, rgba(8,12,20,0.95) 75%)` : "linear-gradient(140deg, rgba(39,49,70,0.92) 0%, rgba(12,16,26,0.95) 75%)", boxShadow: isFlipped ? `0 0 18px ${rarityColor}55` : "0 0 8px rgba(0,0,0,0.4)", padding: 10, boxSizing: "border-box", backfaceVisibility: "hidden" }}>
                    <div style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: 2, color: isFlipped ? rarityColor : COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                      {isFlipped ? q.diff : "unknown"}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: "0.64rem", color: COLORS.text, lineHeight: 1.35, height: 48, overflow: "hidden" }}>
                      {isFlipped ? q.q : "????????????"}
                    </div>
                    <div style={{ position: "absolute", right: 8, bottom: 8, fontFamily: MONO, fontSize: "0.52rem", color: COLORS.textMuted, letterSpacing: 1 }}>
                      #{i + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {revealed.length > 0 && (
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {revealed.map((q, i) => (
                  <div key={`${q.id}-${i}`} style={{ background: "rgba(13,26,45,0.72)", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, fontSize: "0.72rem", color: COLORS.text, fontFamily: MONO, lineHeight: 1.4 }}>{q.q}</div>
                    <TopicTag topic={q.topic} />
                    <DiffTag diff={q.diff} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
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
    const saved = getDeckIds();
    setDeck(saved);
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

  const saveDeck = () => {
    saveDeckIds(deck);
  };

  const canBattle = deck.length === 8;

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

            <Divider />
            <div style={{ display: "grid", gap: 8 }}>
              <ActionBtn onClick={saveDeck} label="Save Deck" accent={COLORS.accent} disabled={!canBattle} flex />
              <ActionBtn onClick={() => onNav("solo-battle")} label="Play Solo (Self 1v1)" accent={COLORS.gold} disabled={!canBattle} flex />
              <ActionBtn onClick={() => onNav("room-create")} label="Play Multiplayer" accent={COLORS.green} disabled={!canBattle} flex />
            </div>
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
  RoomWaitScreen,
  formatMs,
};

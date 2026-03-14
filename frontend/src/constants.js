// ── Landing-page matched colour palette ──────────────────────────────────
export const COLORS = {
  bg:          "#000000",
  bgGrad:      "radial-gradient(circle at center, #1c2a3d 0%, #000000 100%)",
  surface:     "#0a1628",
  card:        "#0d1a2d",
  border:      "rgba(74, 144, 226, 0.25)",
  borderHover: "#4A90E2",
  accent:      "#4A90E2",
  accentGlow:  "#4A90E2",
  accentDim:   "rgba(74, 144, 226, 0.12)",
  gold:        "#f1fa8c",
  goldDim:     "rgba(241,250,140,0.12)",
  green:       "#50fa7b",
  red:         "#ff5555",
  blue:        "#4A90E2",
  purple:      "#bd93f9",
  text:        "#ffffff",
  textMuted:   "rgba(255,255,255,0.5)",
  textDim:     "rgba(255,255,255,0.18)",
};

export const diffColor = {
  easy:   "#50fa7b",
  medium: "#f1fa8c",
  hard:   "#ff5555",
};

export const diffBg = {
  easy:   "rgba(80,250,123,0.08)",
  medium: "rgba(241,250,140,0.08)",
  hard:   "rgba(255,85,85,0.08)",
};

export const TOPICS = ["Data Structures", "Algorithms", "Networking", "Operating Systems", "AI", "Databases", "Programming"];

// Normalise a backend question object → frontend shape
export function normaliseQuestion(q) {
  return {
    id:    q.questionId || q.id,
    q:     q.questionText || q.q || "",
    topic: q.topic || "General",
    diff:  q.difficulty || q.diff || "medium",
    hint:  q.hint || "",
    pts:   q.difficulty === "hard" ? 400 : q.difficulty === "medium" ? 200 : 100,
    owned: true,
  };
}

// Offline fallback – only used if the backend is unreachable
export const MOCK_COLLECTION = [
  { id: "easy_1",  q: "What is the time complexity of accessing an array element by index?",    topic: "Data Structures",   diff: "easy",   hint: "Direct memory addressing.",      owned: true  },
  { id: "easy_4",  q: "What is the time complexity of a linear search?",                        topic: "Algorithms",         diff: "easy",   hint: "Check every element.",          owned: true  },
  { id: "easy_7",  q: "Which OSI layer handles routing?",                                       topic: "Networking",          diff: "easy",   hint: "IP addresses live here.",        owned: true  },
  { id: "med_1",   q: "How does chaining handle Hash Table collisions?",                        topic: "Data Structures",   diff: "medium", hint: "Creates a list at the slot.",   owned: true  },
  { id: "med_3",   q: "Explain the 3-way handshake in TCP.",                                   topic: "Networking",          diff: "medium", hint: "SYN, SYN-ACK, ACK.",            owned: true  },
  { id: "med_5",   q: "What is the difference between a process and a thread?",                topic: "Operating Systems",  diff: "medium", hint: "Processes are isolated.",        owned: true  },
  { id: "hard_1",  q: "Explain the properties of a Red-Black Tree.",                           topic: "Data Structures",   diff: "hard",   hint: "Self-balancing with colour rules.", owned: true },
  { id: "hard_5",  q: "What is the Dining Philosophers Problem?",                              topic: "Operating Systems",  diff: "hard",   hint: "Philosophers, forks, deadlocks.", owned: true },
  { id: "hard_10", q: "What is NP-Completeness?",                                              topic: "Algorithms",         diff: "hard",   hint: "Hardest problems in NP class.",  owned: false },
  { id: "med_15",  q: "What is Overfitting in Machine Learning?",                              topic: "AI",                  diff: "medium", hint: "Memorising instead of learning.", owned: false },
];

export const LEADERBOARD = [
  { rank: 1, name: "xX_CodeGod_Xx", wins: 142, avatar: "CG" },
  { rank: 2, name: "AlgoKing",       wins: 118, avatar: "AK" },
  { rank: 3, name: "ByteWizard",     wins: 97,  avatar: "BW" },
  { rank: 4, name: "You",            wins: 34,  avatar: "ME", isMe: true },
  { rank: 5, name: "null_pointer",   wins: 29,  avatar: "NP" },
];

// Landing-page fonts (JetBrains Mono + Schoolbell handwriting)
export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;800&family=Schoolbell&display=swap');`;

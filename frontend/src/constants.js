export const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a26",
  border: "#2a2a3e",
  accent: "#7c3aed",
  accentGlow: "#9f7aea",
  accentDim: "#4c1d95",
  gold: "#f59e0b",
  goldDim: "#78350f",
  green: "#10b981",
  red: "#ef4444",
  blue: "#3b82f6",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#334155",
};

export const diffColor = {
  easy: COLORS.green,
  medium: COLORS.gold,
  hard: COLORS.red,
};

export const diffBg = {
  easy: "#052e16",
  medium: "#451a03",
  hard: "#450a0a",
};

export const TOPICS = ["DSA", "Algorithms", "Systems Design", "OS", "Networking", "Math"];

export const MOCK_COLLECTION = [
  { id: 1,  q: "What is the time complexity of quicksort in the worst case?", topic: "Algorithms",      diff: "easy",   owned: true  },
  { id: 2,  q: "Explain how a hash map handles collisions.",                   topic: "DSA",             diff: "medium", owned: true  },
  { id: 3,  q: "What is a deadlock? How can it be prevented?",                 topic: "OS",              diff: "medium", owned: true  },
  { id: 4,  q: "Implement a LRU cache from scratch.",                          topic: "DSA",             diff: "hard",   owned: true  },
  { id: 5,  q: "Explain the CAP theorem.",                                     topic: "Systems Design",  diff: "hard",   owned: true },
  { id: 6,  q: "What is a red-black tree?",                                    topic: "DSA",             diff: "medium", owned: false },
  { id: 7,  q: "What is TCP vs UDP?",                                          topic: "Networking",      diff: "easy",   owned: true  },
  { id: 8,  q: "What is a B-tree and where is it used?",                       topic: "DSA",             diff: "hard",   owned: false },
  { id: 9,  q: "Explain Dijkstra's algorithm.",                                topic: "Algorithms",      diff: "medium", owned: true  },
  { id: 10, q: "What is a bloom filter?",                                      topic: "DSA",             diff: "hard",   owned: false },
  { id: 11, q: "Explain binary search.",                                       topic: "Algorithms",      diff: "easy",   owned: true  },
  { id: 12, q: "What is eventual consistency?",                                topic: "Systems Design",  diff: "hard",   owned: false },
];

export const LEADERBOARD = [
  { rank: 1, name: "xX_CodeGod_Xx",  wins: 142, avatar: "CG" },
  { rank: 2, name: "AlgoKing",        wins: 118, avatar: "AK" },
  { rank: 3, name: "ByteWizard",      wins: 97,  avatar: "BW" },
  { rank: 4, name: "You",             wins: 34,  avatar: "ME", isMe: true },
  { rank: 5, name: "null_pointer",    wins: 29,  avatar: "NP" },
];

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap');`;

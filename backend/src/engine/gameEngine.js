const roomService = require('../services/roomService');
const moveService = require('../services/moveService');
const aiService = require('../services/aiService');
const playerService = require('../services/playerService');

const GAME_TIME = 10 * 60 * 1000;

const BASE_POINTS = {
  easy: 100,
  medium: 250,
  hard: 500,
};

function now() {
  return Date.now();
}

function iso() {
  return new Date().toISOString();
}

function createPlayerState(playerId, deck) {
  return {
    playerId,
    score: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    streak: 0,
    bestStreak: 0,
    currentIndex: 0,
    completed: false,
    totalAnswerMs: 0,
    finishedAt: null,
    deck,
    questionStartTime: now(),
  };
}

function calculatePoints(question, responseTime, streak, aiScore) {
  const base = BASE_POINTS[question.difficulty] || 100;
  const speedBonus = Math.max(0, Math.round(200 - responseTime / 50));
  const streakBonus = Math.min(streak * 50, 300);

  let accuracyBonus = 0;
  if (aiScore) {
    accuracyBonus = Math.round((aiScore - 0.94) * 1000);
    if (accuracyBonus < 0) accuracyBonus = 0;
  }

  return {
    base,
    speedBonus,
    streakBonus,
    accuracyBonus,
    total: base + speedBonus + streakBonus + accuracyBonus,
  };
}

function getPlayerFinishTimeMs(player) {
  if (!player) return Number.MAX_SAFE_INTEGER;
  if (typeof player.totalAnswerMs === 'number') return player.totalAnswerMs;
  return Number.MAX_SAFE_INTEGER;
}

function resolveWinner(room) {
  const hostId = room.hostPlayerId;
  const guestId = room.guestPlayerId;
  const host = room.gameState.players[hostId];
  const guest = room.gameState.players[guestId];

  if (host.score > guest.score) return { winnerId: hostId, loserId: guestId, reason: 'score' };
  if (guest.score > host.score) return { winnerId: guestId, loserId: hostId, reason: 'score' };

  // Tie-breaker: fastest total answer time wins.
  const hostTime = getPlayerFinishTimeMs(host);
  const guestTime = getPlayerFinishTimeMs(guest);
  if (hostTime <= guestTime) return { winnerId: hostId, loserId: guestId, reason: 'speed' };
  return { winnerId: guestId, loserId: hostId, reason: 'speed' };
}

function maybeFinalizeGame(room) {
  if (!room || !room.gameState || room.status === 'FINISHED') return;

  const players = room.gameState.players;
  const ids = Object.keys(players);
  if (ids.length < 2) return;

  const allCompleted = ids.every((id) => players[id].completed === true);
  const timedOut = room.gameState.endTime <= now();
  if (!allCompleted && !timedOut) return;

  room.gameState.phase = 'FINISHED';
  room.status = 'FINISHED';
  room.endedAt = iso();

  const outcome = resolveWinner(room);
  room.winnerPlayerId = outcome.winnerId;

  const winnerState = room.gameState.players[outcome.winnerId];
  playerService.recordMatchResult(outcome.winnerId, outcome.loserId, winnerState?.totalAnswerMs);
}

function startGame(roomId, requesterPlayerId) {
  const room = roomService.getRoom(roomId);

  if (requesterPlayerId !== room.hostPlayerId) {
    throw new Error('Only host can start');
  }

  if (!roomService.canStartGame(roomId)) {
    throw new Error('Both players must submit decks and ready up before starting');
  }

  if (!room.guestPlayerId) {
    throw new Error('Cannot start game without a guest player');
  }

  if (room.status !== 'LOBBY') {
    throw new Error('Game already started');
  }

  const hostDeck = room.submittedQuestionSets[room.hostPlayerId];
  const guestDeck = room.submittedQuestionSets[room.guestPlayerId];

  room.gameState = {
    phase: 'IN_GAME',
    startTime: iso(),
    endTime: now() + GAME_TIME,
    players: {
      [room.hostPlayerId]: createPlayerState(room.hostPlayerId, guestDeck),
      [room.guestPlayerId]: createPlayerState(room.guestPlayerId, hostDeck),
    },
  };

  room.status = 'IN_GAME';
  room.startedAt = iso();
  room.endedAt = null;
  room.winnerPlayerId = null;

  moveService.initRoomMoves(roomId);
  return room.gameState;
}

function buildPublicGameState(roomId) {
  const room = roomService.getRoom(roomId);

  if (!room.gameState) {
    return {
      phase: room.status,
      timeLeft: 0,
      players: {},
      winnerPlayerId: room.winnerPlayerId,
      status: room.status,
      endedAt: room.endedAt,
    };
  }

  maybeFinalizeGame(room);

  return {
    phase: room.gameState.phase,
    timeLeft: Math.max(0, room.gameState.endTime - now()),
    players: room.gameState.players,
    winnerPlayerId: room.winnerPlayerId,
    status: room.status,
    endedAt: room.endedAt,
  };
}

async function getCurrentQuestionForPlayer(roomId, playerId) {
  const room = roomService.getRoom(roomId);

  if (!room.gameState || !room.gameState.players[playerId]) {
    throw new Error('Player not in active game');
  }

  maybeFinalizeGame(room);
  if (room.status === 'FINISHED') {
    return { completed: true, gameOver: true, winnerPlayerId: room.winnerPlayerId };
  }

  const player = room.gameState.players[playerId];
  if (player.completed) {
    return { completed: true };
  }

  const questionId = player.deck[player.currentIndex];
  const question = await aiService.getQuestion(questionId);

  return {
    questionId,
    question,
    score: player.score,
  };
}

async function submitAnswer({ roomId, playerId, questionId, answer }) {
  const room = roomService.getRoom(roomId);

  if (!room.gameState || !room.gameState.players[playerId]) {
    throw new Error('Player not in active game');
  }

  const player = room.gameState.players[playerId];
  const currentId = player.deck[player.currentIndex];

  if (currentId !== questionId) {
    throw new Error('Wrong question');
  }

  const grading = await aiService.gradeAnswer(questionId, answer);
  if (!grading) {
    throw new Error('AI failure');
  }

  const correct = grading.isCorrect;
  const responseTime = now() - player.questionStartTime;
  player.totalAnswerMs += responseTime;

  const question = await aiService.getQuestion(questionId);
  let points = { total: 0 };

  if (correct) {
    points = calculatePoints(question, responseTime, player.streak, grading.score);
    player.score += points.total;
    player.correct += 1;
    player.streak += 1;
    if (player.streak > player.bestStreak) player.bestStreak = player.streak;
  } else {
    player.wrong += 1;
    player.streak = 0;
  }

  player.currentIndex += 1;
  player.questionStartTime = now();

  if (player.currentIndex >= player.deck.length) {
    player.completed = true;
    player.finishedAt = iso();
  }

  moveService.recordMove(roomId, {
    type: 'ANSWER',
    playerId,
    correct,
    points: points.total,
  });

  maybeFinalizeGame(room);

  return {
    correct,
    points: points.total,
    score: player.score,
    finished: player.completed,
    gameOver: room.status === 'FINISHED',
    winnerPlayerId: room.winnerPlayerId,
  };
}

function skipQuestion(roomId, playerId) {
  const room = roomService.getRoom(roomId);
  const player = room.gameState.players[playerId];

  player.streak = 0;
  player.skipped += 1;
  player.currentIndex += 1;
  player.questionStartTime = now();

  if (player.currentIndex >= player.deck.length) {
    player.completed = true;
    player.finishedAt = iso();
  }

  maybeFinalizeGame(room);

  return {
    skipped: true,
    gameOver: room.status === 'FINISHED',
    winnerPlayerId: room.winnerPlayerId,
  };
}

module.exports = {
  startGame,
  buildPublicGameState,
  getCurrentQuestionForPlayer,
  submitAnswer,
  skipQuestion,
};

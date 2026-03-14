const db = require('../store/db');
const createGameState = require('../models/createGameState');
const roomService = require('../services/roomService');
const questionService = require('../services/questionService');
const scoringService = require('../services/scoringService');
const moveService = require('../services/moveService');
const playerService = require('../services/playerService');
const checkAnswer = require('./checkEngine');
const httpError = require('../utils/httpError');
const { MOVE_TYPE } = require('../constants/gameConstants');

function startGame(roomId, requesterPlayerId) {
  const room = roomService.getRoom(roomId);
  roomService.ensurePlayerInRoom(room, requesterPlayerId);

  if (room.hostPlayerId !== requesterPlayerId) {
    throw httpError(403, 'only the host can start the game');
  }

  if (!room.guestPlayerId) {
    throw httpError(400, 'cannot start game without a guest');
  }

  const hostQuestions = room.submittedQuestionSets[room.hostPlayerId] || [];
  const guestQuestions = room.submittedQuestionSets[room.guestPlayerId] || [];

  if (hostQuestions.length !== 8 || guestQuestions.length !== 8) {
    throw httpError(400, 'both players must submit 8 questions before starting');
  }

  if (!room.playersReady[room.hostPlayerId] || !room.playersReady[room.guestPlayerId]) {
    throw httpError(400, 'both players must be ready before starting');
  }

  const gameState = createGameState(room.id, room.hostPlayerId, room.guestPlayerId);
  gameState.questionAssignments[room.hostPlayerId] = guestQuestions;
  gameState.questionAssignments[room.guestPlayerId] = hostQuestions;

  db.gameStates.set(room.id, gameState);
  roomService.markStarted(room.id);

  moveService.recordMove({
    roomId,
    playerId: requesterPlayerId,
    type: MOVE_TYPE.START,
    payload: {}
  });

  return buildPublicGameState(room.id);
}

function getGameState(roomId) {
  const gameState = db.gameStates.get(roomId);
  if (!gameState) {
    throw httpError(404, 'game state not found');
  }
  return gameState;
}

function getCurrentQuestionForPlayer(roomId, playerId) {
  const gameState = getGameState(roomId);
  const room = roomService.getRoom(roomId);
  roomService.ensurePlayerInRoom(room, playerId);

  const questionIds = gameState.questionAssignments[playerId];
  const answerHistory = gameState.answerHistory[playerId];
  const nextIndex = answerHistory.length;

  if (nextIndex >= questionIds.length) {
    return null;
  }

  const question = questionService.getQuestionById(questionIds[nextIndex]);

  return {
    index: nextIndex,
    total: questionIds.length,
    questionId: question.id,
    topic: question.topic,
    difficulty: question.difficulty,
    rarity: question.rarity,
    question: question.question
  };
}

function submitAnswer({ roomId, playerId, answer, usedHint = false, timeTakenMs = 0 }) {
  const room = roomService.getRoom(roomId);
  roomService.ensurePlayerInRoom(room, playerId);

  if (room.status !== 'PLAYING') {
    throw httpError(400, 'game is not currently active');
  }

  const gameState = getGameState(roomId);
  const currentQuestion = getCurrentQuestionForPlayer(roomId, playerId);

  if (!currentQuestion) {
    throw httpError(400, 'no more questions remaining for this player');
  }

  const fullQuestion = questionService.getQuestionById(currentQuestion.questionId);
  const isCorrect = checkAnswer(answer, fullQuestion.answer);
  const points = scoringService.calculatePoints({
    question: fullQuestion,
    isCorrect,
    usedHint,
    timeTakenMs
  });

  gameState.answerHistory[playerId].push({
    questionId: fullQuestion.id,
    submittedAnswer: answer,
    correctAnswer: fullQuestion.answer,
    isCorrect,
    usedHint,
    timeTakenMs,
    pointsAwarded: points
  });

  gameState.scores[playerId] += points;
  gameState.timeSpentMs[playerId] += Number(timeTakenMs) || 0;

  if (usedHint) {
    gameState.hintsUsed[playerId] += 1;
  }

  moveService.recordMove({
    roomId,
    playerId,
    type: usedHint ? MOVE_TYPE.USE_HINT : MOVE_TYPE.ANSWER_QUESTION,
    payload: {
      questionId: fullQuestion.id,
      answer,
      isCorrect,
      points,
      timeTakenMs
    }
  });

  if (isGameOver(gameState)) {
    return finishGame(roomId);
  }

  return {
    result: {
      questionId: fullQuestion.id,
      isCorrect,
      pointsAwarded: points,
      correctAnswer: fullQuestion.answer
    },
    gameState: buildPublicGameState(roomId)
  };
}

function isGameOver(gameState) {
  return gameState.turnOrder.every((playerId) => {
    const assigned = gameState.questionAssignments[playerId].length;
    const answered = gameState.answerHistory[playerId].length;
    return answered >= assigned;
  });
}

function finishGame(roomId) {
  const gameState = getGameState(roomId);
  const winnerPlayerId = scoringService.determineWinner(gameState);

  gameState.finished = true;
  roomService.markFinished(roomId, winnerPlayerId);

  const room = roomService.getRoom(roomId);
  if (winnerPlayerId) {
    const loserPlayerId = [room.hostPlayerId, room.guestPlayerId].find((id) => id !== winnerPlayerId);
    playerService.recordWinLoss(winnerPlayerId, loserPlayerId);
  }

   moveService.recordMove({
    roomId,
    playerId: winnerPlayerId,
    type: MOVE_TYPE.END_GAME,
    payload: {
      winnerPlayerId
    }
  });

  return {
    winnerPlayerId,
    draw: winnerPlayerId === null,
    finalState: buildPublicGameState(roomId)
  };
}

function buildPublicGameState(roomId) {
  const room = roomService.getRoom(roomId);
  const gameState = getGameState(roomId);

  return {
    room: {
      id: room.id,
      hostPlayerId: room.hostPlayerId,
      guestPlayerId: room.guestPlayerId,
      status: room.status,
      phase: room.phase,
      winnerPlayerId: room.winnerPlayerId
    },
    game: {
      scores: gameState.scores,
      timeSpentMs: gameState.timeSpentMs,
      hintsUsed: gameState.hintsUsed,
      answerCounts: Object.fromEntries(
        Object.entries(gameState.answerHistory).map(([playerId, answers]) => [playerId, answers.length])
      ),
      finished: gameState.finished
    }
  };
}

module.exports = {
  startGame,
  getGameState,
  getCurrentQuestionForPlayer,
  submitAnswer,
  finishGame,
  buildPublicGameState
};
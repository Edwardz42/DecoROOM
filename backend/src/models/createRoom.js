const { ROOM_STATUS, GAME_PHASE } = require('../constants/gameConstants');

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function createRoom(hostPlayerId) {
  return {
    id: generateId(),
    hostPlayerId,
    guestPlayerId: null,

    status: ROOM_STATUS.LOBBY,
    phase: GAME_PHASE.LOBBY,

    playersReady: {
      [hostPlayerId]: false
    },

    submittedQuestionSets: {
      [hostPlayerId]: []
    },

    gameState: {
      scores: {
        [hostPlayerId]: 0
      },

      answers: {
        [hostPlayerId]: []
      },

      questionsAnswered: {
        [hostPlayerId]: 0
      }
    },

    createdAt: new Date().toISOString(),
    startedAt: null,
    endedAt: null,
    winnerPlayerId: null
  };
}

module.exports = createRoom;
const { ROOM_STATUS, GAME_PHASE } = require('../constants/gameConstants');

function generateId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let id = "";
  for (let i = 0; i < 2; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  id += '-';
  for (let i = 0; i < 4; i++) {
    id += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return id;
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
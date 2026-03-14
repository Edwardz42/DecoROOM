function createGameState(roomId, hostPlayerId, guestPlayerId) {
  return {
    roomId,
    turnOrder: [hostPlayerId, guestPlayerId],
    currentRound: 0,
    totalRounds: 8,
    currentPromptPlayerId: hostPlayerId,
    questionAssignments: {
      [hostPlayerId]: [],
      [guestPlayerId]: []
    },
    answerHistory: {
      [hostPlayerId]: [],
      [guestPlayerId]: []
    },
    scores: {
      [hostPlayerId]: 0,
      [guestPlayerId]: 0
    },
    timeSpentMs: {
      [hostPlayerId]: 0,
      [guestPlayerId]: 0
    },
    hintsUsed: {
      [hostPlayerId]: 0,
      [guestPlayerId]: 0
    },
    finished: false
  };
}

module.exports = createGameState;
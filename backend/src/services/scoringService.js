const { DIFFICULTY_POINTS } = require('../constants/gameConstants');

function calculatePoints({ question, isCorrect, usedHint, timeTakenMs }) {
  if (!isCorrect) {
    return 0;
  }

  let points = DIFFICULTY_POINTS[question.difficulty] || 0;

  if (usedHint) {
    points = Math.max(1, Math.floor(points / 2));
  }

  if (typeof timeTakenMs === 'number') {
    if (timeTakenMs <= 5000) {
      points += 1;
    } else if (timeTakenMs >= 20000) {
      points = Math.max(1, points - 1);
    }
  }

  return points;
}

function determineWinner(gameState) {
  const [playerA, playerB] = gameState.turnOrder;
  const scoreA = gameState.scores[playerA];
  const scoreB = gameState.scores[playerB];

  if (scoreA > scoreB) {
    return playerA;
  }

  if (scoreB > scoreA) {
    return playerB;
  }

  const timeA = gameState.timeSpentMs[playerA];
  const timeB = gameState.timeSpentMs[playerB];

  if (timeA < timeB) {
    return playerA;
  }

  if (timeB < timeA) {
    return playerB;
  }

  return null;
}

module.exports = {
  calculatePoints,
  determineWinner
};
const db = require('../store/db');

function recordMove(move) {
  db.moves.push({
    ...move,
    timestamp: new Date().toISOString()
  });
}

function getMovesForRoom(roomId) {
  return db.moves.filter((move) => move.roomId === roomId);
}

module.exports = {
  recordMove,
  getMovesForRoom
};
const roomMoves = {};

function initRoomMoves(roomId) {
  roomMoves[roomId] = [];
}

function recordMove(roomId, move) {
  if (!roomMoves[roomId]) {
    roomMoves[roomId] = [];
  }

  roomMoves[roomId].push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...move
  });
}

function getMovesForRoom(roomId) {
  return roomMoves[roomId] || [];
}

module.exports = {
  initRoomMoves,
  recordMove,
  getMovesForRoom
};
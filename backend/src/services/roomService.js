const { randomUUID } = require('crypto');  

const rooms = {};

function createNewRoom(hostPlayerId) {
  if (!hostPlayerId) {
    throw new Error('hostPlayerId required');
  }

  const room = {
    id: randomUUID().slice(0,8),   
    hostPlayerId,
    guestPlayerId: null,
    status: 'LOBBY',
    playersReady: {
      [hostPlayerId]: false
    },
    submittedQuestionSets: {
      [hostPlayerId]: []
    },
    createdAt: new Date().toISOString(),
    startedAt: null,
    endedAt: null,
    winnerPlayerId: null,
    gameState: null
  };

  rooms[room.id] = room;
  return room;
}

function getRoom(roomId) {
  const room = rooms[roomId];

  if (!room) {
    throw new Error('Room not found');
  }

  return room;
}

function getAllRooms() {
  return Object.values(rooms);
}

function assertPlayerInRoom(room, playerId) {
  if (room.hostPlayerId !== playerId && room.guestPlayerId !== playerId) {
    throw new Error('Player is not in this room');
  }
}

function joinRoom(roomId, guestPlayerId) {
  const room = getRoom(roomId);

  if (!guestPlayerId) {
    throw new Error('guestPlayerId required');
  }

  if (room.status !== 'LOBBY') {
    throw new Error('Cannot join a room after the game has started');
  }

  if (room.guestPlayerId) {
    throw new Error('Room is already full');
  }

  if (guestPlayerId === room.hostPlayerId) {
    throw new Error('Host and guest cannot be the same player');
  }

  room.guestPlayerId = guestPlayerId;
  room.playersReady[guestPlayerId] = false;
  room.submittedQuestionSets[guestPlayerId] = [];

  return room;
}

function setPlayerReady(roomId, playerId, ready) {
  const room = getRoom(roomId);

  assertPlayerInRoom(room, playerId);

  if (room.status !== 'LOBBY') {
    throw new Error('Players can only ready up while the room is in LOBBY');
  }

  room.playersReady[playerId] = ready === true;
  return room;
}

function submitQuestionSet(roomId, playerId, questionIds) {
  const room = getRoom(roomId);

  assertPlayerInRoom(room, playerId);

  if (room.status !== 'LOBBY') {
    throw new Error('Question decks can only be submitted while the room is in LOBBY');
  }

  room.submittedQuestionSets[playerId] = [...questionIds];
  return room;
}

function hasBothQuestionSets(roomId) {
  const room = getRoom(roomId);

  if (!room.guestPlayerId) {
    return false;
  }

  const hostDeck = room.submittedQuestionSets[room.hostPlayerId] || [];
  const guestDeck = room.submittedQuestionSets[room.guestPlayerId] || [];

  return hostDeck.length > 0 && guestDeck.length > 0;
}

function canStartGame(roomId) {
  const room = getRoom(roomId);

  if (!room.guestPlayerId) {
    return false;
  }

  if (!hasBothQuestionSets(roomId)) {
    return false;
  }

  const hostReady = room.playersReady[room.hostPlayerId] === true;
  const guestReady = room.playersReady[room.guestPlayerId] === true;

  return hostReady && guestReady;
}

function getOpponentPlayerId(roomId, playerId) {
  const room = getRoom(roomId);

  assertPlayerInRoom(room, playerId);

  if (room.hostPlayerId === playerId) {
    return room.guestPlayerId;
  }

  return room.hostPlayerId;
}

module.exports = {
  createNewRoom,
  getRoom,
  getAllRooms,
  joinRoom,
  setPlayerReady,
  submitQuestionSet,
  hasBothQuestionSets,
  canStartGame,
  getOpponentPlayerId,
  assertPlayerInRoom
};
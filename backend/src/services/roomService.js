const rooms = {};

function createNewRoom(hostPlayerId){

  const id = Math.random()
    .toString(36)
    .substring(2,8);

  const room = {

    id,

    hostPlayerId,

    guestPlayerId:null,

    status:"LOBBY",

    playersReady:{
      [hostPlayerId]:false
    },

    submittedQuestionSets:{
      [hostPlayerId]:[]
    },

    scores:{},

    startedAt:null
  };

  rooms[id] = room;

  return room;
}

function getRoom(roomId){

  if(!rooms[roomId]){
    throw new Error("Room not found");
  }

  return rooms[roomId];
}

function getAllRooms(){
  return Object.values(rooms);
}

function joinRoom(roomId,guestPlayerId){

  const room = getRoom(roomId);

  if(room.guestPlayerId){
    throw new Error("Room full");
  }

  room.guestPlayerId = guestPlayerId;

  room.playersReady[guestPlayerId] = false;

  room.submittedQuestionSets[guestPlayerId] = [];

  room.scores[room.hostPlayerId] = 0;
  room.scores[guestPlayerId] = 0;

  return room;
}

function setPlayerReady(roomId,playerId,ready){

  const room = getRoom(roomId);

  room.playersReady[playerId] = ready;

  return room;
}

function canStartGame(roomId){

  const room = getRoom(roomId);

  if(!room.guestPlayerId){
    return false;
  }

  return (
    room.playersReady[room.hostPlayerId] &&
    room.playersReady[room.guestPlayerId]
  );
}

function startGame(roomId){

  const room = getRoom(roomId);

  room.status = "IN_GAME";

  room.startedAt = new Date();

  return room;
}

function submitQuestionSet(
  roomId,
  playerId,
  questions
){

  const room = getRoom(roomId);

  room.submittedQuestionSets[playerId] =
    questions;

  return room;
}

module.exports = {

  createNewRoom,

  getRoom,

  getAllRooms,

  joinRoom,

  setPlayerReady,

  submitQuestionSet,

  canStartGame,

  startGame
};
const { randomUUID } = require('crypto');

const players = {};

function createPlayer(username){

   if(!username){

      throw new Error("username required");

   }

   // prevent duplicate usernames
   const existing =
   Object.values(players)
   .find(
      p=>p.username===username
   );

   if(existing){

      return existing;

   }

   const id =
   "p_" +
   randomUUID().slice(0,8);

   const player = {

      id,

      username,

      createdAt:
      new Date().toISOString()

   };

   players[id] = player;

   return player;

}

function getPlayer(playerId){

   const player =
   players[playerId];

   if(!player){

      throw new Error(
         "Player not found"
      );

   }

   return player;

}

function getAllPlayers(){

   return Object.values(
      players
   );

}

module.exports = {

   createPlayer,

   getPlayer,

   getAllPlayers

};
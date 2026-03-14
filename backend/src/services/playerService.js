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

      wins: 0,
      matches: 0,
      bestTimeMs: null,

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

function recordMatchResult(winnerPlayerId, loserPlayerId, winnerTimeMs) {
   const winner = players[winnerPlayerId];
   const loser = players[loserPlayerId];

   if (!winner || !loser) {
      return;
   }

   winner.matches += 1;
   loser.matches += 1;
   winner.wins += 1;

   if (typeof winnerTimeMs === 'number' && winnerTimeMs >= 0) {
      if (winner.bestTimeMs === null || winnerTimeMs < winner.bestTimeMs) {
         winner.bestTimeMs = winnerTimeMs;
      }
   }
}

function getLeaderboard(limit = 25) {
   const sorted = Object.values(players)
      .sort((a, b) => {
         if (b.wins !== a.wins) return b.wins - a.wins;
         const aTime = a.bestTimeMs ?? Number.MAX_SAFE_INTEGER;
         const bTime = b.bestTimeMs ?? Number.MAX_SAFE_INTEGER;
         if (aTime !== bTime) return aTime - bTime;
         return a.username.localeCompare(b.username);
      })
      .slice(0, limit)
      .map((p, idx) => ({
         rank: idx + 1,
         id: p.id,
         username: p.username,
         wins: p.wins,
         matches: p.matches,
         bestTimeMs: p.bestTimeMs,
         winRate: p.matches ? Number((p.wins / p.matches).toFixed(2)) : 0,
      }));

   return sorted;
}

module.exports = {

   createPlayer,

   getPlayer,

   getAllPlayers,
   recordMatchResult,
   getLeaderboard

};
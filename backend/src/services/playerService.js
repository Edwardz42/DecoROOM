const db = require('../store/db');
const createPlayer = require('../models/createPlayer');
const httpError = require('../utils/httpError');

function registerPlayer({ email, name }) {
  if (!email || !name) {
    throw httpError(400, 'email and name are required');
  }

  const existingPlayer = Array.from(db.players.values()).find(
    (player) => player.email.toLowerCase() === email.toLowerCase()
  );

  if (existingPlayer) {
    return existingPlayer;
  }

  const player = createPlayer({ email, name });
  db.players.set(player.id, player);
  return player;
}

function getPlayer(playerId) {
  const player = db.players.get(playerId);
  if (!player) {
    throw httpError(404, 'player not found');
  }
  return player;
}

function getLeaderboard() {
  return Array.from(db.players.values())
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name))
    .map((player) => ({
      id: player.id,
      name: player.name,
      wins: player.wins,
      losses: player.losses
    }));
}

function recordWinLoss(winnerPlayerId, loserPlayerId) {
  const winner = getPlayer(winnerPlayerId);
  const loser = getPlayer(loserPlayerId);

  winner.wins += 1;
  loser.losses += 1;
}

function addCardsToCollection(playerId, cards) {
  const player = getPlayer(playerId);
  player.collection.push(...cards.map((card) => card.id));
  player.packsOpened += 1;
  return player;
}

function getPlayerCollection(playerId) {
  const player = getPlayer(playerId);
  return {
    playerId: player.id,
    name: player.name,
    collection: player.collection,
    packsOpened: player.packsOpened
  };
}

module.exports = {
  registerPlayer,
  getPlayer,
  getLeaderboard,
  recordWinLoss,
  addCardsToCollection,
  getPlayerCollection
};
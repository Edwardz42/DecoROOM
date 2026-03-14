const playerService = require('../services/playerService');

function registerPlayer(req, res, next) {
  try {
    const player = playerService.registerPlayer(req.body);
    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
}

function getLeaderboard(req, res, next) {
  try {
    const leaderboard = playerService.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

function getCollection(req, res, next) {
  try {
    const { playerId } = req.params;
    const collection = playerService.getPlayerCollection(playerId);
    res.json(collection);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerPlayer,
  getLeaderboard,
  getCollection
};
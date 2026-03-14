const questionBank = require('../data/questionBank');
const { PACK_TYPE } = require('../constants/gameConstants');
const { shuffle } = require('../utils/random');
const playerService = require('./playerService');
const httpError = require('../utils/httpError');

function buildPoolByPackType(packType) {
  if (packType === PACK_TYPE.BASIC) {
    return questionBank.filter((q) => ['common', 'rare'].includes(q.rarity));
  }

  if (packType === PACK_TYPE.ADVANCED) {
    return questionBank;
  }

  throw httpError(400, 'invalid pack type');
}

function openPack({ playerId, packType = PACK_TYPE.BASIC }) {
  playerService.getPlayer(playerId);

  const pool = buildPoolByPackType(packType);
  const drawn = shuffle(pool).slice(0, 5);

  playerService.addCardsToCollection(playerId, drawn);

  return {
    playerId,
    packType,
    cards: drawn
  };
}

module.exports = {
  openPack
};
const express = require('express');
const playerController = require('../controllers/playerController');

const router = express.Router();

router.post('/', playerController.registerPlayer);
router.get('/leaderboard', playerController.getLeaderboard);
router.get('/:playerId/collection', playerController.getCollection);

module.exports = router;
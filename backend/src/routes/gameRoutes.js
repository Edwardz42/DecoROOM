const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

/* Start game */
router.post('/:roomId/start', gameController.startGame);

/* Game state */
router.get('/:roomId/state', gameController.getState);

/* Current question */
router.get('/:roomId/question', gameController.getCurrentQuestion);

/* Submit answer */
router.post('/:roomId/answer', gameController.submitAnswer);

/* Move history */
router.get('/:roomId/moves', gameController.getMoves);

module.exports = router;
const express = require('express');

const gameController =
require('../controllers/gameController');

const router =
express.Router();

router.post(
   '/:roomId/start',
   gameController.startGame
);

router.get(
   '/:roomId/state',
   gameController.getState
);

router.get(
   '/:roomId/question',
   gameController.getCurrentQuestion
);

router.post(
   '/answer',
   gameController.submitAnswer
);

router.get(
   '/:roomId/moves',
   gameController.getMoves
);

module.exports = router;
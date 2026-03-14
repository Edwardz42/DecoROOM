const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

/* Debug / list rooms */
router.get('/', roomController.getAllRooms);

/* Create room */
router.post('/', roomController.createRoom);

/* Get room state */
router.get('/:roomId', roomController.getRoom);

/* Join room */
router.post('/:roomId/join', roomController.joinRoom);

/* Ready player */
router.post('/:roomId/ready', roomController.setReady);

/* Submit questions */
router.post('/:roomId/questions', roomController.submitQuestionSet);

module.exports = router;
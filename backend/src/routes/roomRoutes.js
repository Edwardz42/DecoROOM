const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);
router.get('/:roomId', roomController.getRoom);
router.post('/:roomId/join', roomController.joinRoom);
router.post('/:roomId/ready', roomController.setReady);
router.post('/:roomId/questions', roomController.submitQuestionSet);

module.exports = router;
const roomService = require('../services/roomService');
const questionService = require('../services/questionService');
const gameEngine = require('../engine/gameEngine');

function createRoom(req, res, next) {
  try {
    const { hostPlayerId } = req.body;

    if (!hostPlayerId) {
      return res.status(400).json({
        error: 'hostPlayerId required'
      });
    }

    const room = roomService.createNewRoom(hostPlayerId);
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
}

function joinRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const { guestPlayerId } = req.body;

    if (!guestPlayerId) {
      return res.status(400).json({
        error: 'guestPlayerId required'
      });
    }

    const room = roomService.joinRoom(roomId, guestPlayerId);
    res.json(room);
  } catch (error) {
    next(error);
  }
}

function getRoom(req, res, next) {
  try {
    const room = roomService.getRoom(req.params.roomId);
    res.json(room);
  } catch (error) {
    next(error);
  }
}

function getAllRooms(req, res, next) {
  try {
    const rooms = roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
}

function setReady(req, res, next) {
  try {
    const { roomId } = req.params;
    const { playerId, ready } = req.body;

    if (!playerId) {
      return res.status(400).json({
        error: 'playerId required'
      });
    }

    roomService.setPlayerReady(roomId, playerId, ready === true);

    if (roomService.canStartGame(roomId)) {
      const room = roomService.getRoom(roomId);

      if (room.status === 'LOBBY' && !room.gameState) {
        gameEngine.startGame(roomId, room.hostPlayerId);
      }
    }

    res.json(roomService.getRoom(roomId));
  } catch (error) {
    next(error);
  }
}

function submitQuestionSet(req, res, next) {
  try {
    const { roomId } = req.params;
    const { playerId, questionIds } = req.body;

    if (!playerId || !Array.isArray(questionIds)) {
      return res.status(400).json({
        error: 'playerId and questionIds required'
      });
    }

    const validatedQuestions = questionService.validateQuestionSet(questionIds);

    roomService.submitQuestionSet(
      roomId,
      playerId,
      validatedQuestions.map((question) => question.id)
    );

    if (roomService.canStartGame(roomId)) {
      const room = roomService.getRoom(roomId);

      if (room.status === 'LOBBY' && !room.gameState) {
        gameEngine.startGame(roomId, room.hostPlayerId);
      }
    }

    res.json(roomService.getRoom(roomId));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  getAllRooms,
  setReady,
  submitQuestionSet
};
const roomService = require('../services/roomService');
const questionService = require('../services/questionService');

function createRoom(req, res, next) {
  try {

    const { hostPlayerId } = req.body;

    if (!hostPlayerId) {
      return res.status(400).json({
        error: "hostPlayerId required"
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

    if (!guestPlayerId){
      return res.status(400).json({
        error:"guestPlayerId required"
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

function getAllRooms(req,res){
  try{

    const rooms = roomService.getAllRooms();

    res.json(rooms);

  }
  catch(error){
    next(error);
  }
}

function setReady(req, res, next) {
  try {

    const { roomId } = req.params;
    const { playerId, ready } = req.body;

    if (!playerId){
      return res.status(400).json({
        error:"playerId required"
      });
    }

    const room = roomService.setPlayerReady(
      roomId,
      playerId,
      ready
    );

    /* Auto start game */
    if(roomService.canStartGame(roomId)){
      roomService.startGame(roomId);
    }

    res.json(room);

  } catch (error) {
    next(error);
  }
}

function submitQuestionSet(req, res, next) {
  try {

    const { roomId } = req.params;
    const { playerId, questionIds } = req.body;

    if(!playerId || !questionIds){
      return res.status(400).json({
        error:"playerId and questionIds required"
      });
    }

    const validatedQuestions =
      questionService.validateQuestionSet(
        questionIds
      );

    const room =
      roomService.submitQuestionSet(
        roomId,
        playerId,
        validatedQuestions.map(q => q.id)
      );

    res.json(room);

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
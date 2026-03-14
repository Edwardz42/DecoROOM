const gameEngine = require('../engine/gameEngine');
const moveService = require('../services/moveService');

function startGame(req, res, next) {

  try {

    const { roomId } = req.params;
    const { requesterPlayerId } = req.body;

    if(!requesterPlayerId){
      return res.status(400).json({
        error:"requesterPlayerId required"
      });
    }

    const result =
      gameEngine.startGame(
        roomId,
        requesterPlayerId
      );

    res.json({
      status:"GAME_STARTED",
      game:result
    });

  }
  catch(error){
    next(error);
  }

}

function getState(req, res, next){

  try{

    const { roomId } = req.params;

    const state =
      gameEngine.buildPublicGameState(
        roomId
      );

    res.json({
      status:"OK",
      state
    });

  }
  catch(error){
    next(error);
  }

}

function getCurrentQuestion(req,res,next){

  try{

    const { roomId } = req.params;
    const { playerId } = req.query;

    if(!playerId){
      return res.status(400).json({
        error:"playerId required"
      });
    }

    const question =
      gameEngine.getCurrentQuestionForPlayer(
        roomId,
        playerId
      );

    res.json({
      status:"OK",
      question
    });

  }
  catch(error){
    next(error);
  }

}

function submitAnswer(req,res,next){

  try{

    const {
      roomId,
      playerId,
      questionId,
      answer
    } = req.body;

    if(
      !roomId ||
      !playerId ||
      !questionId ||
      answer === undefined
    ){
      return res.status(400).json({
        error:"roomId, playerId, questionId, answer required"
      });
    }

    const result =
      gameEngine.submitAnswer({

        roomId,
        playerId,
        questionId,
        answer

      });

    res.json({

      status:"ANSWER_PROCESSED",

      correct:result.correct,

      scoreUpdate:result.scoreUpdate,

      nextQuestion:result.nextQuestion,

      gameFinished:result.gameFinished,

      winner:result.winner

    });

  }
  catch(error){
    next(error);
  }

}

function getMoves(req,res,next){

  try{

    const { roomId } = req.params;

    const moves =
      moveService.getMovesForRoom(
        roomId
      );

    res.json({

      status:"OK",

      moveCount:moves.length,

      moves

    });

  }
  catch(error){
    next(error);
  }

}

module.exports = {

  startGame,

  getState,

  getCurrentQuestion,

  submitAnswer,

  getMoves

};
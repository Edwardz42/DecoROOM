const gameEngine = require('../engine/gameEngine');
const moveService = require('../services/moveService');
const roomService = require('../services/roomService');
const aiService = require('../services/aiService');

async function startGame(req,res,next){

   try{

      const {roomId} = req.params;
      const {requesterPlayerId} = req.body;

      const result =
      gameEngine.startGame(
         roomId,
         requesterPlayerId
      );

      res.json(result);

   }
   catch(error){

      next(error);

   }

}

async function getState(req,res,next){

   try{

      const {roomId} = req.params;

      const state =
      gameEngine.buildPublicGameState(
         roomId
      );

      res.json(state);

   }
   catch(error){

      next(error);

   }

}

async function getCurrentQuestion(req,res,next){

   try{

      const {roomId} = req.params;
      const {playerId} = req.query;

      const question =
      await gameEngine.getCurrentQuestionForPlayer(
         roomId,
         playerId
      );

      res.json(question);

   }
   catch(error){

      next(error);

   }

}

async function submitAnswer(req,res,next){

   try{

      const {roomId} = req.params;

      const {
         playerId,
         questionId,
         answer
      } = req.body;

      const result =
      await gameEngine.submitAnswer({

         roomId,
         playerId,
         questionId,
         answer

      });

      res.json(result);

   }
   catch(error){

      next(error);

   }

}

async function getHint(req,res,next){

   try{

      const {roomId} = req.params;
      const {playerId, playerInput} = req.body;

      const room =
      roomService.getRoom(roomId);

      const playerState =
      room?.gameState?.players?.[playerId];

      if(!playerState){

         throw new Error(
            'Player not in active game'
         );

      }

      const currentQuestionId =
      playerState.deck[
         playerState.currentIndex
      ];

      if(!currentQuestionId){

         return res.json({
            hint:null,
            completed:true
         });

      }

      const hintResult =
      await aiService.getHint(
         currentQuestionId,
         playerInput || null
      );

      res.json({
         questionId: currentQuestionId,
         hint: hintResult.hint,
         usedHint: true
      });

   }
   catch(error){

      next(error);

   }

}

async function skipQuestion(req,res,next){

   try{

      const {roomId} = req.params;
      const {playerId} = req.body;

      const result =
      gameEngine.skipQuestion(
         roomId,
         playerId
      );

      res.json(result);

   }
   catch(error){

      next(error);

   }

}

async function getMoves(req,res,next){

   try{

      const {roomId} = req.params;

      const moves =
      moveService.getMovesForRoom(
         roomId
      );

      res.json(moves);

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
   getHint,
   skipQuestion,
   getMoves

};
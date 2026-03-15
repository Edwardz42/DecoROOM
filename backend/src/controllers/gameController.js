const gameEngine = require('../engine/gameEngine');
const moveService = require('../services/moveService');

async function startGame(req,res,next){

   try{

      const {roomId} = req.params;
      const {requesterPlayerId} = req.body;

      if(!roomId || !requesterPlayerId){

         return res.status(400).json({

            error:"roomId and requesterPlayerId required"

         });

      }

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

      if(!roomId){

         return res.status(400).json({

            error:"roomId required"

         });

      }

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

      if(!playerId){

         return res.status(400).json({

            error:"playerId required"

         });

      }

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

      if(

         !playerId ||
         !questionId ||
         answer === undefined

      ){

         return res.status(400).json({

            error:
            "playerId, questionId, answer required"

         });

      }

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

async function skipQuestion(req,res,next){

   try{

      const {roomId} = req.params;
      const {playerId} = req.body;

      if(!playerId){

         return res.status(400).json({

            error:"playerId required"

         });

      }

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
   skipQuestion,
   getMoves

};
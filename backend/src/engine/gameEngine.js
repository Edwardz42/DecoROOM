const roomService = require('../services/roomService');
const questionService = require('../services/questionService');
const moveService = require('../services/moveService');
const aiService = require('../services/aiService');

const GAME_TIME = 10 * 60 * 1000;

const BASE_POINTS = {

   easy:100,
   medium:250,
   hard:500

};

function now(){

   return Date.now();

}

function iso(){

   return new Date().toISOString();

}

function createPlayerState(
   playerId,
   deck
){

   return {

      playerId,

      score:0,

      correct:0,

      wrong:0,

      skipped:0,

      streak:0,

      bestStreak:0,

      currentIndex:0,

      completed:false,

      deck,

      questionStartTime:now()

   };

}

function calculatePoints(

   question,
   responseTime,
   streak,
   aiScore

){

   const base =
   BASE_POINTS[
      question.difficulty
   ] || 100;

   const speedBonus =
   Math.max(

      0,

      Math.round(

         200 -
         (responseTime/50)

      )

   );

   const streakBonus =
   Math.min(
      streak*50,
      300
   );

   let accuracyBonus = 0;

   if(aiScore){

      accuracyBonus =
      Math.round(
         (aiScore-0.94)*1000
      );

      if(accuracyBonus < 0){

         accuracyBonus = 0;

      }

   }

   return {

      base,
      speedBonus,
      streakBonus,
      accuracyBonus,

      total:
      base+
      speedBonus+
      streakBonus+
      accuracyBonus

   };

}

function startGame(
   roomId,
   requesterPlayerId
){

   const room =
   roomService.getRoom(roomId);

   if(
      requesterPlayerId
      !== room.hostPlayerId
   ){

      throw new Error(
         "Only host can start"
      );

   }

   const hostDeck =
   room.submittedQuestionSets[
      room.hostPlayerId
   ];

   const guestDeck =
   room.submittedQuestionSets[
      room.guestPlayerId
   ];

   room.gameState = {

      phase:"IN_GAME",

      startTime:iso(),

      endTime:
      now()+GAME_TIME,

      players:{

         [room.hostPlayerId]:

         createPlayerState(

            room.hostPlayerId,
            guestDeck

         ),

         [room.guestPlayerId]:

         createPlayerState(

            room.guestPlayerId,
            hostDeck

         )

      }

   };

   room.status = "IN_GAME";

   moveService.initRoomMoves(
      roomId
   );

   return room.gameState;

}

function buildPublicGameState(
   roomId
){

   const room =
   roomService.getRoom(roomId);

   return {

      phase:
      room.gameState.phase,

      timeLeft:

      Math.max(

         0,

         room.gameState.endTime
         -
         now()

      ),

      players:

      room.gameState.players

   };

}

async function getCurrentQuestionForPlayer(

   roomId,
   playerId

){

   const room =
   roomService.getRoom(roomId);

   const player =
   room.gameState.players[
      playerId
   ];

   if(player.completed){

      return {

         completed:true

      };

   }

   const questionId =
   player.deck[
      player.currentIndex
   ];

   const question =
   await aiService.getQuestion(
      questionId
   );

   return {

      questionId,

      question,

      score:
      player.score

   };

}

async function submitAnswer({

   roomId,
   playerId,
   questionId,
   answer

}){

   const room =
   roomService.getRoom(roomId);

   const player =
   room.gameState.players[
      playerId
   ];

   const currentId =
   player.deck[
      player.currentIndex
   ];

   if(currentId !== questionId){

      throw new Error(
         "Wrong question"
      );

   }

   const grading =
   await aiService.gradeAnswer(

      questionId,
      answer

   );

   if(!grading){

      throw new Error(
         "AI failure"
      );

   }

   const correct =
   grading.isCorrect;

   const responseTime =
   now()-
   player.questionStartTime;

   const question =
   await aiService.getQuestion(
      questionId
   );

   let points = {

      total:0

   };

   if(correct){

      points =
      calculatePoints(

         question,
         responseTime,
         player.streak,
         grading.score

      );

      player.score +=
      points.total;

      player.correct++;

      player.streak++;

      if(
         player.streak
         >
         player.bestStreak
      ){

         player.bestStreak =
         player.streak;

      }

   }
   else{

      player.wrong++;

      player.streak = 0;

   }

   player.currentIndex++;

   player.questionStartTime =
   now();

   if(

      player.currentIndex
      >=
      player.deck.length

   ){

      player.completed =
      true;

   }

   moveService.recordMove(

      roomId,

      {

         type:"ANSWER",

         playerId,

         correct,

         points:
         points.total

      }

   );

   return {

      correct,

      points:

      points.total,

      score:

      player.score,

      finished:

      player.completed

   };

}

function skipQuestion(

   roomId,
   playerId

){

   const room =
   roomService.getRoom(roomId);

   const player =
   room.gameState.players[
      playerId
   ];

   player.streak = 0;

   player.skipped++;

   player.currentIndex++;

   player.questionStartTime =
   now();

   return {

      skipped:true

   };

}

module.exports = {

   startGame,

   buildPublicGameState,

   getCurrentQuestionForPlayer,

   submitAnswer,

   skipQuestion

};
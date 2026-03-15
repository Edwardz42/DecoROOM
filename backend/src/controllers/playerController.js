const playerService =
require('../services/playerService');

function createPlayer(req,res,next){

   try{

      const {username} =
      req.body;

      if(!username){

         return res
         .status(400)
         .json({

            error:"username required"

         });

      }

      const player =
      playerService.createPlayer(
         username
      );

      res.status(201).json(
         player
      );

   }
   catch(error){

      next(error);

   }

}

function getPlayer(req,res,next){

   try{

      const {playerId} =
      req.params;

      const player =
      playerService.getPlayer(
         playerId
      );

      res.json(player);

   }
   catch(error){

      next(error);

   }

}

function getPlayers(req,res,next){

   try{

      const players =
      playerService.getAllPlayers();

      res.json(players);

   }
   catch(error){

      next(error);

   }

}

function getLeaderboard(req, res, next) {

   try {

      const limit = Number(req.query.limit) || 25;
      const leaderboard = playerService.getLeaderboard(limit);

      res.json(leaderboard);

   }
   catch (error) {

      next(error);

   }

}

module.exports = {

   createPlayer,

   getPlayer,

   getPlayers,

   getLeaderboard

};
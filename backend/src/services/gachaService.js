const { getElasticClient } = require('./elasticService');

const INDEX_NAME =
process.env.ELASTIC_INDEX
|| "gacha_questions";

async function openPack(playerId){

   if(!playerId){

      throw new Error(
         "playerId required"
      );

   }

   const client =
   getElasticClient();

   try{

      const response =
      await client.search({

         index:
         INDEX_NAME,

         size:8,

         query:{

            function_score:{

               query:{
                  match_all:{}
               },

               random_score:{}

            }

         }

      });

      if(
         !response.hits ||
         !response.hits.hits
      ){

         throw new Error(
            "No questions returned"
         );

      }

      const pack =
      response.hits.hits.map(hit => {

         const q =
         hit._source || {};

         return{

            questionId:
            hit._id,

            difficulty:
            q.difficulty ||
            "easy"

         };

      });

      return{

         playerId,

         pack,

         openedAt:
         new Date().toISOString()

      };

   }
   catch(error){

      console.error(

         "Elastic pack pull failed:",

         error.meta?.body ||
         error.message

      );

      throw new Error(

         "Failed to fetch questions from database"

      );

   }

}

module.exports = {

   openPack

};

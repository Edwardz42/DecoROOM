const { getElasticClient } = require('./elasticService');

const INDEX_NAME =
process.env.ELASTIC_INDEX
|| "questions";

function validateQuestionSet(questionIds){

   if(
      !Array.isArray(questionIds)
   ){

      throw new Error(
         "Deck must be array"
      );

   }

   if(
      questionIds.length !== 8
   ){

      throw new Error(
         "Deck must contain 8 cards"
      );

   }

   for(const id of questionIds){

      if(
         typeof id !== "string"
      ){

         throw new Error(
            "Question IDs must be strings"
         );

      }

      if(
         id.trim() === ""
      ){

         throw new Error(
            "Question ID cannot be empty"
         );

      }

   }

   const uniqueIds =
   new Set(questionIds);

   if(
      uniqueIds.size !== 8
   ){

      throw new Error(
         "Deck cannot contain duplicate questions"
      );

   }

   return questionIds;

}

async function getAllQuestions(){

   const client =
   getElasticClient();

   try{

      const response =
      await client.search({

         index:
         INDEX_NAME,

         size: 1000,

         query: {
            match_all: {}
         }

      });

      if(
         !response.hits ||
         !response.hits.hits
      ){

         return [];

      }

      return response.hits.hits.map(hit => {

         const q =
         hit._source || {};

         return {

            questionId:
            q.question_id
            || hit._id,

            title:
            q.title
            || "",

            difficulty:
            q.difficulty
            || "unknown",

            topic:
            q.topic
            || ""

         };

      });

   }
   catch(error){

      console.error(

         "Elastic question fetch failed:",

         error.meta?.body
         ||
         error.message

      );

      throw new Error(
         "Failed to fetch questions"
      );

   }

}

async function validateQuestionsExist(questionIds){

   const client =
   getElasticClient();

   try{

      const response =
      await client.search({

         index:
         INDEX_NAME,

         size: 8,

         query: {

            terms: {

               question_id:
               questionIds

            }

         }

      });

      if(
         response.hits.hits.length !== 8
      ){

         throw new Error(
            "Some questions do not exist"
         );

      }

   }
   catch(error){

      console.error(

         "Elastic validation failed:",

         error.meta?.body
         ||
         error.message

      );

      throw new Error(
         "Question validation failed"
      );

   }

}

module.exports = {

   validateQuestionSet,

   getAllQuestions,

   validateQuestionsExist

};

const { getElasticClient } = require('./elasticService');

const INDEX =
process.env.ELASTIC_INDEX
|| "gacha_questions";

async function gradeAnswer(
   questionId,
   playerAnswer
){

   const client =
   getElasticClient();

   try{

      const response =
      await client.get({

         index:INDEX,

         id:questionId

      });

      const q =
      response._source;

      const ideal =
      (q.ideal_answer || "")
      .toLowerCase()
      .trim();

      const answer =
      (playerAnswer || "")
      .toLowerCase()
      .trim();

      // smarter grading
      const correct =

         answer === ideal ||

         ideal.includes(answer) ||

         answer.includes(ideal);

      return{

         correct,

         score:
         correct ? 1 : 0,

         feedback:
         correct
         ? "Correct"
         : "Incorrect",

         hint:
         correct
         ? null
         : q.hint || null,

         question:q

      };

   }
   catch(error){

      console.error(
         "Elastic grading failed:",
         error.message
      );

      throw new Error(
         "AI_GRADING_FAILED"
      );

   }

}

async function getQuestion(questionId){

   const client =
   getElasticClient();

   try{

      const response =
      await client.get({

         index:INDEX,

         id:questionId

      });

      return response._source;

   }
   catch(error){

      throw new Error(
         "QUESTION_FETCH_FAILED"
      );

   }

}

module.exports = {

   gradeAnswer,
   getQuestion

};
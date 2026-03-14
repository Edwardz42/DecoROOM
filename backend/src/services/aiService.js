const axios = require('axios');

// CHANGE THIS when Yash gives real endpoint
const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4000';

async function gradeAnswer(questionId, playerAnswer){

   try{

      const response = await axios.post(
         `${AI_BASE_URL}/grade`,
         {
            questionId,
            answer:playerAnswer
         }
      );

      return response.data;

   }
   catch(error){

      console.error("AI grading failed:",error.message);

      throw new Error("AI_GRADING_FAILED");

   }

}

async function getQuestion(questionId){

   try{

      const response = await axios.get(
         `${AI_BASE_URL}/question/${questionId}`
      );

      return response.data;

   }
   catch(error){

      console.error("Question fetch failed:",error.message);

      throw new Error("QUESTION_FETCH_FAILED");

   }

}

module.exports = {
   gradeAnswer,
   getQuestion
};
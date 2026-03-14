const { Client } = require('@elastic/elasticsearch');

const INDEX = 'gacha_questions';
const INFERENCE_ID = 'gacha-inference';
const THRESHOLD = 0.94;

let client;

function getElasticClient() {
   if (client) return client;

   const { ELASTIC_CLOUD_ID, ELASTIC_USERNAME, ELASTIC_PASSWORD } = process.env;
   if (!ELASTIC_CLOUD_ID || !ELASTIC_USERNAME || !ELASTIC_PASSWORD) {
      throw new Error('ELASTIC_CONFIG_MISSING');
   }

   client = new Client({
      cloud: { id: ELASTIC_CLOUD_ID },
      auth: {
         username: ELASTIC_USERNAME,
         password: ELASTIC_PASSWORD
      }
   });

   return client;
}

function ensureElasticConfig() {
   if (!process.env.ELASTIC_CLOUD_ID || !process.env.ELASTIC_USERNAME || !process.env.ELASTIC_PASSWORD) {
      throw new Error('ELASTIC_CONFIG_MISSING');
   }
}

async function gradeAnswer(questionId, playerInput) {
   try {
      ensureElasticConfig();

      const res = await getElasticClient().search({
         index: INDEX,
         query: {
            knn: {
               field: 'answer_vector',
               query_vector_builder: {
                  text_embedding: {
                     model_id: INFERENCE_ID,
                     model_text: playerInput
                  }
               },
               k: 1,
               num_candidates: 10,
               filter: {
                  term: {
                     question_id: questionId
                  }
               }
            }
         },
         _source: ['question_id', 'ideal_answer', 'hint']
      });

      const hit = res.hits?.hits?.[0] || null;
      const score = hit?._score || 0;
      const isCorrect = score >= THRESHOLD;

      return {
         isCorrect,
         score,
         threshold: THRESHOLD,
         matchedQuestionId: hit?._source?.question_id || null,
         idealAnswer: hit?._source?.ideal_answer || null
      };
   } catch (error) {
      console.error('AI grading failed:', error.message);
      throw new Error('AI_GRADING_FAILED');
   }
}

async function getQuestion(questionId) {
   try {
      ensureElasticConfig();

      const res = await getElasticClient().search({
         index: INDEX,
         size: 1,
         query: {
            term: {
               question_id: questionId
            }
         },
         _source: ['question_id', 'topic', 'question_text', 'ideal_answer', 'hint', 'difficulty']
      });

      const hit = res.hits?.hits?.[0] || null;

      if (!hit) {
         throw new Error('QUESTION_NOT_FOUND');
      }

      const source = hit._source;

      return {
         id: source.question_id,
         topic: source.topic,
         questionText: source.question_text,
         idealAnswer: source.ideal_answer,
         hint: source.hint,
         difficulty: source.difficulty || 'medium'
      };
   } catch (error) {
      console.error('Question fetch failed:', error.message);
      throw new Error('QUESTION_FETCH_FAILED');
   }
}

async function getHint(questionId, playerInput = null) {
   try {
      ensureElasticConfig();

      if (!playerInput) {
         const question = await getQuestion(questionId);
         return {
            questionId,
            hint: question.hint || 'No hint available.'
         };
      }

      const res = await getElasticClient().search({
         index: INDEX,
         query: {
            knn: {
               field: 'answer_vector',
               query_vector_builder: {
                  text_embedding: {
                     model_id: INFERENCE_ID,
                     model_text: playerInput
                  }
               },
               k: 1,
               num_candidates: 10,
               filter: {
                  term: {
                     question_id: questionId
                  }
               }
            }
         },
         _source: ['question_id', 'hint']
      });

      const hit = res.hits?.hits?.[0] || null;

      return {
         questionId,
         hint: hit?._source?.hint || 'Think about the core concept and constraints.'
      };
   } catch (error) {
      console.error('Hint fetch failed:', error.message);
      throw new Error('HINT_FETCH_FAILED');
   }
}

module.exports = {
   gradeAnswer,
   getQuestion,
   getHint
};
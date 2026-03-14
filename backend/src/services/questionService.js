const { Client } = require('@elastic/elasticsearch');

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

function normalizeQuestionId(questionRef) {
   if (typeof questionRef === 'string') {
      return questionRef;
   }

   if (questionRef && typeof questionRef === 'object') {
      return questionRef.id || questionRef.questionId || questionRef.question_id || null;
   }

   return null;
}

function validateQuestionSet(questionIds) {
   if (!Array.isArray(questionIds)) {
      throw new Error('Deck must be array');
   }

   if (questionIds.length !== 8) {
      throw new Error('Deck must contain 8 cards');
   }

   const normalizedIds = questionIds.map(normalizeQuestionId).filter(Boolean);

   if (normalizedIds.length !== 8) {
      throw new Error('Each card must include a valid question id');
   }

   return normalizedIds.map((id) => ({ id }));
}

async function getAllQuestions(size = 100) {
   const res = await getElasticClient().search({
      index: 'gacha_questions',
      size,
      query: {
         match_all: {}
      },
      _source: ['question_id', 'topic', 'question_text', 'hint', 'difficulty']
   });

   return (res.hits?.hits || []).map((hit) => ({
      id: hit._source.question_id,
      topic: hit._source.topic,
      questionText: hit._source.question_text,
      hint: hit._source.hint,
      difficulty: hit._source.difficulty || 'medium'
   }));
}

module.exports = {
   validateQuestionSet,
   getAllQuestions
};
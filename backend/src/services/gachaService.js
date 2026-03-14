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

async function openPack(payload) {
   const playerId = payload?.playerId;

   if (!playerId) {
      throw new Error('playerId required');
   }

    const res = await getElasticClient().search({
      index: 'gacha_questions',
      size: 8,
      query: {
         function_score: {
            query: {
               match_all: {}
            },
            random_score: {},
            boost_mode: 'replace'
         }
      },
      _source: ['question_id', 'topic', 'question_text', 'hint', 'difficulty']
   });

   const pack = (res.hits?.hits || []).map((hit) => ({
      questionId: hit._source.question_id,
      topic: hit._source.topic,
      questionText: hit._source.question_text,
      hint: hit._source.hint,
      difficulty: hit._source.difficulty || 'medium'
   }));

   return {
      playerId,
      pack,
      openedAt: new Date().toISOString()
   };
}

module.exports = {
   openPack
};
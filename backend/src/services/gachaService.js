const { Client } = require('@elastic/elasticsearch');

const client = new Client({
   cloud: {
      id: process.env.ELASTIC_CLOUD_ID
   },
   auth: {
      username: process.env.ELASTIC_USERNAME,
      password: process.env.ELASTIC_PASSWORD
   }
});

async function openPack(payload) {
   const playerId = payload?.playerId;

   if (!playerId) {
      throw new Error('playerId required');
   }

   const res = await client.search({
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
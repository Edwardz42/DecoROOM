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

   const rarityBuckets = {
      easy: 5,
      medium: 2,
      hard: 1
   };

   const pulls = await Promise.all(
      Object.entries(rarityBuckets).map(async ([difficulty, count]) => {
         const res = await getElasticClient().search({
            index: 'gacha_questions',
            size: Math.max(count * 3, 6),
            query: {
               bool: {
                  must: [{ term: { difficulty } }]
               }
            },
            _source: ['question_id', 'topic', 'question_text', 'hint', 'difficulty']
         });

         const hits = (res.hits?.hits || [])
            .sort(() => Math.random() - 0.5)
            .slice(0, count);

         return hits;
      })
   );

   const pack = pulls
      .flat()
      .sort(() => Math.random() - 0.5)
      .map((hit) => ({
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
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

// ── Keyword overlap fallback (no ES needed) ─────────────────────────────
function keywordScore(questionText, answerText) {
   const qWords = new Set((questionText || '').toLowerCase().match(/\b\w{4,}\b/g) || []);
   const aWords = ((answerText || '').toLowerCase().match(/\b\w{4,}\b/g) || []);
   if (qWords.size === 0 || aWords.length === 0) return 50;
   let matches = 0;
   for (const w of aWords) if (qWords.has(w)) matches++;
   // generous baseline so short correct answers are not unfairly penalised
   const raw = Math.min(1, (matches / Math.max(qWords.size, 3)) + 0.35);
   return Math.round(raw * 100);
}

// ── Text-based grading (used by /api/ai/evaluate) ───────────────────────
async function gradeAnswerByText(questionText, answerText) {
   try {
      ensureElasticConfig();

      // Find the closest question in the index by text match
      const qRes = await getElasticClient().search({
         index: INDEX,
         size: 1,
         query: { match: { question_text: questionText } },
         _source: ['question_id'],
      });

      const questionId = qRes.hits?.hits?.[0]?._source?.question_id;
      if (!questionId) throw new Error('QUESTION_NOT_FOUND');

      const result = await gradeAnswer(questionId, answerText);
      const score = Math.round(result.score * 100);
      const userCorrect = score >= 60;
      return {
         score,
         feedback: score >= 80
            ? `Excellent answer! (${score}/100)`
            : score >= 60
            ? `Good answer! (${score}/100)`
            : `Needs improvement (${score}/100). Try to cover more key concepts.`,
         isCorrect: userCorrect,
      };
   } catch {
      // Elasticsearch not available — fall back to keyword scoring
      const score = keywordScore(questionText, answerText);
      return {
         score,
         feedback: score >= 60
            ? `Good answer! (${score}/100)`
            : `Partial answer (${score}/100). Be more thorough.`,
         isCorrect: score >= 60,
      };
   }
}

// ── Text-based hint (used by /api/ai/hint) ──────────────────────────────
async function getHintByText(questionText) {
   try {
      ensureElasticConfig();

      const res = await getElasticClient().search({
         index: INDEX,
         size: 1,
         query: { match: { question_text: questionText } },
         _source: ['hint'],
      });

      const hint = res.hits?.hits?.[0]?._source?.hint;
      return { hint: hint || 'Think about the core concepts and constraints.' };
   } catch {
      return { hint: 'Think about the fundamental principles. Consider edge cases and time/space complexity.' };
   }
}

module.exports = {
   gradeAnswer,
   getQuestion,
   getHint,
   gradeAnswerByText,
   getHintByText,
};
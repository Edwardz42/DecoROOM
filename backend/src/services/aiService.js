const { Client } = require('@elastic/elasticsearch');

const INDEX = 'gacha_questions';
const INFERENCE_ID = 'gacha-inference';
const THRESHOLD = 0.94;

const STOP_WORDS = new Set([
   'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from',
   'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'this', 'that', 'these', 'those',
   'as', 'if', 'then', 'than', 'into', 'about', 'what', 'which', 'who', 'whom', 'when', 'where',
   'why', 'how', 'does', 'do', 'did', 'can', 'could', 'should', 'would', 'will', 'just'
]);

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

function normaliseTokens(text) {
   return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function keywordCoverage(referenceText, answerText) {
   const refTokens = normaliseTokens(referenceText);
   const answerTokens = new Set(normaliseTokens(answerText));

   if (refTokens.length === 0) {
      return 0;
   }

   const uniqueRef = [...new Set(refTokens)];
   const covered = uniqueRef.filter((w) => answerTokens.has(w)).length;
   return (covered / uniqueRef.length) * 100;
}

function normaliseSemanticScore(rawScore) {
   // ES kNN score is not a direct percent. This mapping makes it conservative.
   const s = Number(rawScore || 0);
   const pct = ((s - 0.78) / 0.34) * 100;
   return Math.max(0, Math.min(100, pct));
}

function isVagueAnswer(answerText) {
   const a = (answerText || '').trim().toLowerCase();
   if (!a) return true;

   const knownVague = [
      'to work',
      'it works',
      'for working',
      'to make things work',
      'to run things',
      'manage things',
      'handles stuff',
      'does everything',
   ];

   if (knownVague.includes(a)) return true;

   const words = a.split(/\s+/).filter(Boolean);
   return words.length <= 3;
}

function evaluateAnswerQuality({
   answerText,
   questionText,
   idealAnswer,
   semanticRaw,
}) {
   const clean = (answerText || '').trim();
   const words = clean.split(/\s+/).filter(Boolean);
   const wordCount = words.length;

   if (!clean) {
      return {
         score100: 0,
         semanticPct: 0,
         conceptPct: 0,
         isCorrect: false,
      };
   }

   const semanticPct = normaliseSemanticScore(semanticRaw);
   const idealCoveragePct = keywordCoverage(idealAnswer, clean);
   const questionCoveragePct = keywordCoverage(questionText, clean);

   const lengthPct = Math.min(100, (wordCount / 24) * 100);
   const conceptPct = (idealCoveragePct * 0.85) + (questionCoveragePct * 0.15);

   let score100 =
      (semanticPct * 0.50) +
      (conceptPct * 0.40) +
      (lengthPct * 0.10);

   // Hard quality gates: short/vague answers should not pass.
   if (wordCount < 4) score100 *= 0.45;
   if (wordCount < 7) score100 *= 0.85;
   if (conceptPct < 18) score100 *= 0.55;
   if (isVagueAnswer(clean)) score100 = Math.min(score100, 20);

   score100 = Math.max(0, Math.min(100, Math.round(score100)));

   const isCorrect = score100 >= 62 && conceptPct >= 18 && wordCount >= 4;

   return {
      score100,
      semanticPct,
      conceptPct,
      isCorrect,
   };
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
         _source: ['question_id', 'question_text', 'ideal_answer', 'hint']
      });

      const hit = res.hits?.hits?.[0] || null;
      const rawScore = hit?._score || 0;
      const idealAnswer = hit?._source?.ideal_answer || '';
      const questionText = hit?._source?.question_text || '';

      const judged = evaluateAnswerQuality({
         answerText: playerInput,
         questionText,
         idealAnswer,
         semanticRaw: rawScore,
      });

      const score = judged.score100 / 100;
      const isCorrect = judged.isCorrect;

      return {
         isCorrect,
         score,
         rawScore,
         threshold: THRESHOLD,
         matchedQuestionId: hit?._source?.question_id || null,
         idealAnswer: idealAnswer || null,
         diagnostics: {
            semanticPct: judged.semanticPct,
            conceptPct: judged.conceptPct,
            score100: judged.score100,
         }
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
         _source: ['question_id', 'ideal_answer', 'question_text'],
      });

      const matched = qRes.hits?.hits?.[0]?._source || null;
      const questionId = matched?.question_id;
      if (!questionId) throw new Error('QUESTION_NOT_FOUND');

      const result = await gradeAnswer(questionId, answerText);
      const score = Math.round(result.score * 100);
      const userCorrect = score >= 62;
      return {
         score,
         feedback: score >= 85
            ? `Excellent answer! (${score}/100)`
            : score >= 62
            ? `Good answer! (${score}/100)`
            : `Needs improvement (${score}/100). Try to cover more key concepts.`,
         isCorrect: result.isCorrect && userCorrect,
      };
   } catch {
      // Elasticsearch not available — fall back to keyword scoring
      const score = keywordScore(questionText, answerText);
      const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
      const strictScore = wordCount < 4 ? Math.min(score, 25) : score;
      return {
         score: strictScore,
         feedback: strictScore >= 62
            ? `Good answer! (${strictScore}/100)`
            : `Partial answer (${strictScore}/100). Be more thorough and specific.`,
         isCorrect: strictScore >= 62 && wordCount >= 4,
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
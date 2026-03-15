const { Client } = require('@elastic/elasticsearch');

const INDEX = 'gacha_questions';
const INFERENCE_ID = 'gacha-inference';
const THRESHOLD = 0.92;
const NUM_CANDIDATES = 100;

const STOP_WORDS = new Set([
   'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from',
   'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'this', 'that', 'these', 'those',
   'as', 'if', 'then', 'than', 'into', 'about', 'what', 'which', 'who', 'whom', 'when', 'where',
   'why', 'how', 'does', 'do', 'did', 'can', 'could', 'should', 'would', 'will', 'just'
]);

let client;

function buildFeedback(score) {
   return score >= 85
      ? `Excellent answer! (${score}/100)`
      : score >= 62
      ? `Good answer! (${score}/100)`
      : `Needs improvement (${score}/100). Try to cover more key concepts.`;
}

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

   return false;
}

function evaluateAnswerQuality({
   answerText,
   questionText,
   idealAnswer,
   semanticRaw,
}) {
   const clean = (answerText || '').trim();

   if (!clean) {
      return {
         score100: 0,
         semanticPct: 0,
         conceptPct: 0,
         isCorrect: false,
      };
   }

   const semanticPct = normaliseSemanticScore(semanticRaw);
   const semanticPass = Number(semanticRaw || 0) >= THRESHOLD;
   const idealCoveragePct = keywordCoverage(idealAnswer, clean);
   const questionCoveragePct = keywordCoverage(questionText, clean);
   const conceptPct = (idealCoveragePct * 0.85) + (questionCoveragePct * 0.15);

   // If semantic similarity passes, trust the vector judge directly.
   if (semanticPass && !isVagueAnswer(clean)) {
      return {
         score100: Math.round(Number(semanticRaw || 0) * 100),
         semanticPct,
         conceptPct,
         isCorrect: true,
      };
   }

   let score100 =
      (semanticPct * 0.60) +
      (conceptPct * 0.40);

   if (isVagueAnswer(clean)) score100 = Math.min(score100, 20);

   score100 = Math.max(0, Math.min(100, Math.round(score100)));

   return {
      score100,
      semanticPct,
      conceptPct,
      isCorrect: false,
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
               num_candidates: NUM_CANDIDATES,
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
         engine: 'elasticsearch',
         usedElastic: true,
         isCorrect,
         score,
         rawScore,
         threshold: THRESHOLD,
         feedback: buildFeedback(judged.score100),
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
               num_candidates: NUM_CANDIDATES,
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

function normaliseQuestionText(text) {
   return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
}

async function resolveQuestionByText(questionText) {
   ensureElasticConfig();

   const exact = normaliseQuestionText(questionText);
   if (!exact) {
      throw new Error('QUESTION_NOT_FOUND');
   }

   const res = await getElasticClient().search({
      index: INDEX,
      size: 25,
      query: {
         bool: {
            should: [
               { match_phrase: { question_text: { query: questionText, boost: 5 } } },
               { match: { question_text: { query: questionText, operator: 'and', boost: 3 } } },
               { match: { question_text: { query: questionText } } }
            ],
            minimum_should_match: 1
         }
      },
      _source: ['question_id', 'topic', 'question_text', 'ideal_answer', 'hint', 'difficulty']
   });

   const hits = res.hits?.hits || [];
   const exactHit = hits.find((hit) => normaliseQuestionText(hit._source?.question_text) === exact);

   if (!exactHit) {
      throw new Error('QUESTION_NOT_FOUND');
   }

   return {
      id: exactHit._source.question_id,
      topic: exactHit._source.topic,
      questionText: exactHit._source.question_text,
      idealAnswer: exactHit._source.ideal_answer,
      hint: exactHit._source.hint,
      difficulty: exactHit._source.difficulty || 'medium'
   };
}

async function gradeAnswerByQuestionId(questionId, answerText) {
   const result = await gradeAnswer(questionId, answerText);
   const score = Math.round(result.score * 100);

   return {
      engine: result.engine,
      usedElastic: result.usedElastic,
      score,
      rawScore: result.rawScore,
      threshold: result.threshold,
      feedback: result.feedback,
      isCorrect: result.isCorrect,
      diagnostics: result.diagnostics,
      matchedQuestionId: result.matchedQuestionId,
   };
}

// ── Text-based grading (used by /api/ai/evaluate) ───────────────────────
async function gradeAnswerByText(questionText, answerText) {
   try {
      const matched = await resolveQuestionByText(questionText);
      return await gradeAnswerByQuestionId(matched.id, answerText);
   } catch (error) {
      if (error.message !== 'QUESTION_NOT_FOUND') {
         throw error;
      }

      const score = keywordScore(questionText, answerText);
      const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
      const strictScore = wordCount < 4 ? Math.min(score, 25) : score;
      return {
         engine: 'keyword-fallback',
         usedElastic: false,
         score: strictScore,
         rawScore: null,
         threshold: null,
         feedback: strictScore >= 62
            ? `Good answer! (${strictScore}/100)`
            : `Partial answer (${strictScore}/100). Be more thorough and specific.`,
         isCorrect: strictScore >= 62 && wordCount >= 4,
         diagnostics: {
            fallback: true,
            reason: error.message,
         },
         matchedQuestionId: null,
      };
   }
}

// ── Text-based hint (used by /api/ai/hint) ──────────────────────────────
async function getHintByText(questionText) {
   try {
      const question = await resolveQuestionByText(questionText);
      const hint = question.hint;
      return { hint: hint || 'Think about the core concepts and constraints.' };
   } catch {
      return { hint: 'Think about the fundamental principles. Consider edge cases and time/space complexity.' };
   }
}

module.exports = {
   gradeAnswer,
   getQuestion,
   getHint,
   gradeAnswerByQuestionId,
   gradeAnswerByText,
   getHintByText,
};
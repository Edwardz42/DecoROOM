const questionBank = require('../data/questionBank');
const httpError = require('../utils/httpError');

function getAllQuestions() {
  return questionBank;
}

function getQuestionById(questionId) {
  const question = questionBank.find((item) => item.id === questionId);
  if (!question) {
    throw httpError(404, `question ${questionId} not found`);
  }
  return question;
}

function getQuestionsByIds(questionIds) {
  return questionIds.map(getQuestionById);
}

function validateQuestionSet(questionIds) {
  if (!Array.isArray(questionIds)) {
    throw httpError(400, 'questionIds must be an array');
  }

  if (questionIds.length !== 8) {
    throw httpError(400, 'questionIds must contain exactly 8 questions');
  }

  const questions = getQuestionsByIds(questionIds);

  const counts = {
    easy: 0,
    medium: 0,
    hard: 0
  };

  for (const question of questions) {
    counts[question.difficulty] += 1;
  }

  const uniqueIds = new Set(questionIds);
  if (uniqueIds.size !== questionIds.length) {
    throw httpError(400, 'question set cannot contain duplicates');
  }

  if (counts.easy !== 3 || counts.medium !== 3 || counts.hard !== 2) {
    throw httpError(400, 'question set must contain 3 easy, 3 medium, and 2 hard questions');
  }

  return questions;
}

module.exports = {
  getAllQuestions,
  getQuestionById,
  getQuestionsByIds,
  validateQuestionSet
};
const aiService = require('../services/aiService');

async function evaluateAnswer(req, res, next) {
  try {
    const { question, questionId, answer } = req.body;

    if ((!question && !questionId) || typeof answer !== 'string') {
      return res.status(400).json({ error: 'question or questionId, and answer are required' });
    }

    if (!answer.trim()) {
      return res.json({ score: 0, feedback: 'No answer provided.', isCorrect: false });
    }

    const result = questionId
      ? await aiService.gradeAnswerByQuestionId(questionId, answer.trim())
      : await aiService.gradeAnswerByText(question, answer.trim());
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getHint(req, res, next) {
  try {
    const { question, questionId } = req.body;

    if (!question && !questionId) {
      return res.status(400).json({ error: 'question or questionId is required' });
    }

    const result = questionId
      ? await aiService.getHint(questionId)
      : await aiService.getHintByText(question);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { evaluateAnswer, getHint };

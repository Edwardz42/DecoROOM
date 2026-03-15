const aiService = require('../services/aiService');

async function evaluateAnswer(req, res, next) {
  try {
    const { question, answer } = req.body;

    if (!question || typeof answer !== 'string') {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    if (!answer.trim()) {
      return res.json({ score: 0, feedback: 'No answer provided.', isCorrect: false });
    }

    const result = await aiService.gradeAnswerByText(question, answer.trim());
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getHint(req, res, next) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const result = await aiService.getHintByText(question);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { evaluateAnswer, getHint };

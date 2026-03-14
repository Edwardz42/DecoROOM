const gachaService = require('../services/gachaService');
const questionService = require('../services/questionService');

async function openPack(req, res, next) {
  try {
    const result = await gachaService.openPack(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

function getAllQuestions(req, res, next) {
  try {
    const questions = questionService.getAllQuestions();
    res.json(questions);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  openPack,
  getAllQuestions
};
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

async function getAllQuestions(req, res, next) {
  try {
    const size = Number(req.query.size) || 100;
    const questions = await questionService.getAllQuestions(size);
    res.json(questions);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  openPack,
  getAllQuestions
};
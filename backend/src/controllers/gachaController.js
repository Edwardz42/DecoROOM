const gachaService = require('../services/gachaService');
const questionService = require('../services/questionService');

async function openPack(req, res, next) {

  try {

    const { playerId } = req.body;

    if(!playerId){

      throw new Error(
        "playerId required"
      );

    }

    const result =
    await gachaService.openPack(
      playerId
    );

    res.json(result);

  }
  catch (error) {

    next(error);

  }

}

async function getAllQuestions(req, res, next) {

  try {

    const questions =
    await questionService.getAllQuestions();

    res.json(questions);

  }
  catch (error) {

    next(error);

  }

}

module.exports = {

  openPack,
  getAllQuestions

};

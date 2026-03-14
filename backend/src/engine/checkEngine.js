const { normaliseText } = require('../utils/normalise');

function checkAnswer(submittedAnswer, correctAnswer) {
  return normaliseText(submittedAnswer) === normaliseText(correctAnswer);
}

module.exports = checkAnswer;
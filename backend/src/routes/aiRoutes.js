const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/evaluate', aiController.evaluateAnswer);
router.post('/hint', aiController.getHint);

module.exports = router;

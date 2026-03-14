const express = require('express');
const gachaController = require('../controllers/gachaController');

const router = express.Router();

router.post('/open-pack', gachaController.openPack);
router.get('/questions', gachaController.getAllQuestions);

module.exports = router;
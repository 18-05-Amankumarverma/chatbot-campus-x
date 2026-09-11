const express = require('express');
const { postChat } = require('../controllers/chat.controller');

const router = express.Router();
router.post('/', postChat);

module.exports = router;

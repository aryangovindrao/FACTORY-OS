const express = require('express');
const router = express.Router();
const ctrl = require('./chat.controller');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);
router.get('/sessions', ctrl.getSessions);
router.post('/sessions', ctrl.createSession);
router.get('/sessions/:sessionId/messages', ctrl.getMessages);
router.post('/messages', ctrl.sendMessage);

module.exports = router;

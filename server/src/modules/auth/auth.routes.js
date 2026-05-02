const express = require('express');
const router = express.Router();
const auth = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/refresh', auth.refreshToken);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.me);

module.exports = router;

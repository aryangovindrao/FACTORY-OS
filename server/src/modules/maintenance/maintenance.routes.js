const express = require('express');
const router = express.Router();
const ctrl = require('./maintenance.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);
router.get('/', ctrl.getTickets);
router.post('/', ctrl.createTicket);
router.put('/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), ctrl.updateTicket);

module.exports = router;

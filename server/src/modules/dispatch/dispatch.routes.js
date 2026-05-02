const express = require('express');
const router = express.Router();
const ctrl = require('./dispatch.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);
router.get('/', ctrl.getDispatchOrders);
router.post('/', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), ctrl.createDispatchOrder);
router.put('/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), ctrl.updateDispatchOrder);

module.exports = router;

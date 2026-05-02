const express = require('express');
const router = express.Router();
const ctrl = require('./inventory.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/items', ctrl.getStockItems);
router.post('/items', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), ctrl.createStockItem);
router.put('/items/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), ctrl.updateStockItem);
router.post('/transactions', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), ctrl.recordTransaction);
router.get('/warehouses', ctrl.getWarehouses);
router.post('/warehouses', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), ctrl.createWarehouse);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('./vendors.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);
router.get('/', ctrl.getVendors);
router.post('/', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'FINANCE'), ctrl.createVendor);
router.put('/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'FINANCE'), ctrl.updateVendor);
router.get('/purchase-orders', ctrl.getPurchaseOrders);
router.post('/purchase-orders', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), ctrl.createPurchaseOrder);
router.put('/purchase-orders/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), ctrl.updatePurchaseOrder);

module.exports = router;

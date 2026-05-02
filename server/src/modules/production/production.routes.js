const express = require('express');
const router = express.Router();
const prod = require('./production.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

// Work Orders
router.get('/work-orders', prod.getWorkOrders);
router.get('/work-orders/:id', prod.getWorkOrder);
router.post('/work-orders', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), prod.createWorkOrder);
router.put('/work-orders/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), prod.updateWorkOrder);
router.delete('/work-orders/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), prod.deleteWorkOrder);

// Machines
router.get('/machines', prod.getMachines);
router.post('/machines', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), prod.createMachine);
router.put('/machines/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), prod.updateMachine);

// Batches
router.post('/batches', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), prod.createBatch);
router.put('/batches/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), prod.updateBatch);

// QC
router.post('/qc-inspections', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'SUPERVISOR'), prod.createQcInspection);

// Shifts
router.get('/shifts', prod.getShifts);
router.post('/shifts', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER'), prod.createShift);

module.exports = router;

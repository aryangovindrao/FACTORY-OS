const express = require('express');
const router = express.Router();
const ctrl = require('./reports.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);
router.get('/', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'HR', 'FINANCE'), ctrl.getReportsData);

module.exports = router;

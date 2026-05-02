const express = require('express');
const router = express.Router();
const ctrl = require('./employees.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', ctrl.getEmployees);
router.get('/attendance', ctrl.getAttendance);
router.get('/leaves', ctrl.getLeaveRequests);
router.get('/:id', ctrl.getEmployee);
router.post('/', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'HR'), ctrl.createEmployee);
router.put('/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'HR'), ctrl.updateEmployee);
router.post('/attendance', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'HR', 'SUPERVISOR'), ctrl.markAttendance);
router.post('/leaves', ctrl.createLeaveRequest);
router.put('/leaves/:id', authorize('SUPER_ADMIN', 'FACTORY_OWNER', 'MANAGER', 'HR'), ctrl.updateLeaveRequest);

module.exports = router;

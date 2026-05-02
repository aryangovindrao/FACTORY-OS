const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getEmployees = async (req, res, next) => {
  try {
    const { department, type, search, page = 1, limit = 20 } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (department) where.department = department;
    if (type) where.employeeType = type;
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { employeeCode: { contains: search, mode: 'insensitive' } }
    ];
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({ where, orderBy: { firstName: 'asc' }, skip: (page - 1) * limit, take: +limit }),
      prisma.employee.count({ where })
    ]);
    res.json({ success: true, data: employees, pagination: { page: +page, limit: +limit, total } });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const getEmployee = async (req, res, next) => {
  try {
    const emp = await prisma.employee.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { attendance: { take: 30, orderBy: { date: 'desc' } }, leaveRequests: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createEmployee = async (req, res, next) => {
  try {
    const count = await prisma.employee.count({ where: { tenantId: req.user.tenantId } });
    const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;
    const emp = await prisma.employee.create({
      data: { ...req.body, tenantId: req.user.tenantId, employeeCode, joinDate: new Date(req.body.joinDate || Date.now()) }
    });
    res.status(201).json({ success: true, data: emp });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updateEmployee = async (req, res, next) => {
  try {
    await prisma.employee.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: req.body });
    const emp = await prisma.employee.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: emp });
  } catch (e) { next({ status: 500, message: e.message }); }
};

// Attendance
const getAttendance = async (req, res, next) => {
  try {
    const { date, employeeId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (date) where.date = new Date(date);
    if (employeeId) where.employeeId = employeeId;
    const records = await prisma.attendanceRecord.findMany({ where, include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } }, orderBy: { date: 'desc' }, take: 100 });
    res.json({ success: true, data: records });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const markAttendance = async (req, res, next) => {
  try {
    const record = await prisma.attendanceRecord.create({
      data: { ...req.body, tenantId: req.user.tenantId, date: new Date(req.body.date || Date.now()) }
    });
    res.status(201).json({ success: true, data: record });
  } catch (e) { next({ status: 500, message: e.message }); }
};

// Leave requests
const getLeaveRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    const requests = await prisma.leaveRequest.findMany({ where, include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: requests });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createLeaveRequest = async (req, res, next) => {
  try {
    const leave = await prisma.leaveRequest.create({
      data: { ...req.body, tenantId: req.user.tenantId, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate) }
    });
    res.status(201).json({ success: true, data: leave });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updateLeaveRequest = async (req, res, next) => {
  try {
    await prisma.leaveRequest.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: { ...req.body, approvedBy: req.user.id } });
    const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: leave });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, getAttendance, markAttendance, getLeaveRequests, createLeaveRequest, updateLeaveRequest };

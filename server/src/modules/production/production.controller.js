const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ WORK ORDERS ============
const getWorkOrders = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: { machine: { select: { name: true, code: true } }, batches: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.workOrder.count({ where })
    ]);

    res.json({ success: true, data: workOrders, pagination: { page: +page, limit: +limit, total } });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const getWorkOrder = async (req, res, next) => {
  try {
    const wo = await prisma.workOrder.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { machine: true, batches: true, qcInspections: true }
    });
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });
    res.json({ success: true, data: wo });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const createWorkOrder = async (req, res, next) => {
  try {
    const count = await prisma.workOrder.count({ where: { tenantId: req.user.tenantId } });
    const orderNumber = `WO-${String(count + 1).padStart(5, '0')}`;
    const wo = await prisma.workOrder.create({
      data: { ...req.body, tenantId: req.user.tenantId, orderNumber, createdBy: req.user.id }
    });
    const io = req.app.get('io');
    io.to(`tenant-${req.user.tenantId}`).emit('workorder:created', wo);
    res.status(201).json({ success: true, data: wo });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const updateWorkOrder = async (req, res, next) => {
  try {
    const wo = await prisma.workOrder.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    if (!wo.count) return res.status(404).json({ success: false, message: 'Work order not found' });

    const updated = await prisma.workOrder.findUnique({ where: { id: req.params.id }, include: { machine: true } });
    const io = req.app.get('io');
    io.to(`tenant-${req.user.tenantId}`).emit('workorder:updated', updated);
    res.json({ success: true, data: updated });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const deleteWorkOrder = async (req, res, next) => {
  try {
    await prisma.workOrder.deleteMany({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next({ status: 500, message: error.message }); }
};

// ============ MACHINES ============
const getMachines = async (req, res, next) => {
  try {
    const machines = await prisma.machine.findMany({
      where: { tenantId: req.user.tenantId, isActive: true },
      include: { machineLogs: { take: 1, orderBy: { startTime: 'desc' } } },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: machines });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const createMachine = async (req, res, next) => {
  try {
    const machine = await prisma.machine.create({
      data: { ...req.body, tenantId: req.user.tenantId }
    });
    res.status(201).json({ success: true, data: machine });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const updateMachine = async (req, res, next) => {
  try {
    const result = await prisma.machine.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    if (!result.count) return res.status(404).json({ success: false, message: 'Machine not found' });
    const machine = await prisma.machine.findUnique({ where: { id: req.params.id } });

    const io = req.app.get('io');
    io.to(`tenant-${req.user.tenantId}`).emit('machine:updated', machine);
    res.json({ success: true, data: machine });
  } catch (error) { next({ status: 500, message: error.message }); }
};

// ============ BATCHES ============
const createBatch = async (req, res, next) => {
  try {
    const count = await prisma.batch.count({ where: { tenantId: req.user.tenantId } });
    const batchNumber = `B-${String(count + 1).padStart(5, '0')}`;
    const batch = await prisma.batch.create({
      data: { ...req.body, tenantId: req.user.tenantId, batchNumber }
    });
    res.status(201).json({ success: true, data: batch });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const updateBatch = async (req, res, next) => {
  try {
    await prisma.batch.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: batch });
  } catch (error) { next({ status: 500, message: error.message }); }
};

// ============ QC INSPECTIONS ============
const createQcInspection = async (req, res, next) => {
  try {
    const inspection = await prisma.qcInspection.create({
      data: { ...req.body, tenantId: req.user.tenantId }
    });
    const io = req.app.get('io');
    io.to(`tenant-${req.user.tenantId}`).emit('qc:completed', inspection);
    res.status(201).json({ success: true, data: inspection });
  } catch (error) { next({ status: 500, message: error.message }); }
};

// ============ SHIFTS ============
const getShifts = async (req, res, next) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { startTime: 'asc' }
    });
    res.json({ success: true, data: shifts });
  } catch (error) { next({ status: 500, message: error.message }); }
};

const createShift = async (req, res, next) => {
  try {
    const shift = await prisma.shift.create({
      data: { ...req.body, tenantId: req.user.tenantId }
    });
    res.status(201).json({ success: true, data: shift });
  } catch (error) { next({ status: 500, message: error.message }); }
};

module.exports = {
  getWorkOrders, getWorkOrder, createWorkOrder, updateWorkOrder, deleteWorkOrder,
  getMachines, createMachine, updateMachine,
  createBatch, updateBatch,
  createQcInspection,
  getShifts, createShift
};

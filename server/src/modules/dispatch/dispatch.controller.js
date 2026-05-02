const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDispatchOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    const [orders, total] = await Promise.all([
      prisma.dispatchOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: +limit }),
      prisma.dispatchOrder.count({ where })
    ]);
    res.json({ success: true, data: orders, pagination: { page: +page, limit: +limit, total } });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createDispatchOrder = async (req, res, next) => {
  try {
    const count = await prisma.dispatchOrder.count({ where: { tenantId: req.user.tenantId } });
    const orderNumber = `DSP-${String(count + 1).padStart(5, '0')}`;
    const order = await prisma.dispatchOrder.create({
      data: { ...req.body, tenantId: req.user.tenantId, orderNumber, createdBy: req.user.id }
    });
    res.status(201).json({ success: true, data: order });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updateDispatchOrder = async (req, res, next) => {
  try {
    await prisma.dispatchOrder.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: req.body });
    const order = await prisma.dispatchOrder.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: order });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getDispatchOrders, createDispatchOrder, updateDispatchOrder };

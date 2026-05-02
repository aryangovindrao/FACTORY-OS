const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getVendors = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { gstNumber: { contains: search, mode: 'insensitive' } }
    ];
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: +limit }),
      prisma.vendor.count({ where })
    ]);
    res.json({ success: true, data: vendors, pagination: { page: +page, limit: +limit, total } });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.create({ data: { ...req.body, tenantId: req.user.tenantId } });
    res.status(201).json({ success: true, data: vendor });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updateVendor = async (req, res, next) => {
  try {
    await prisma.vendor.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: req.body });
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: vendor });
  } catch (e) { next({ status: 500, message: e.message }); }
};

// Purchase Orders
const getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, vendorId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    const orders = await prisma.purchaseOrder.findMany({
      where, include: { vendor: { select: { name: true, code: true } } }, orderBy: { createdAt: 'desc' }, take: 50
    });
    res.json({ success: true, data: orders });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const count = await prisma.purchaseOrder.count({ where: { tenantId: req.user.tenantId } });
    const poNumber = `PO-${String(count + 1).padStart(5, '0')}`;
    const po = await prisma.purchaseOrder.create({
      data: { ...req.body, tenantId: req.user.tenantId, poNumber, createdBy: req.user.id }
    });
    res.status(201).json({ success: true, data: po });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updatePurchaseOrder = async (req, res, next) => {
  try {
    await prisma.purchaseOrder.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: req.body });
    const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { vendor: true } });
    res.json({ success: true, data: po });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getVendors, createVendor, updateVendor, getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder };

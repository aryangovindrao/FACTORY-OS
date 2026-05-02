const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStockItems = async (req, res, next) => {
  try {
    const { category, warehouseId, search, page = 1, limit = 20 } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (category) where.category = category;
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
    const [items, total] = await Promise.all([
      prisma.stockItem.findMany({ where, include: { warehouse: { select: { name: true, code: true } } }, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: +limit }),
      prisma.stockItem.count({ where })
    ]);
    // Low stock alerts
    const lowStock = items.filter(i => i.quantity <= i.reorderLevel && i.reorderLevel > 0);
    res.json({ success: true, data: items, lowStockCount: lowStock.length, pagination: { page: +page, limit: +limit, total } });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createStockItem = async (req, res, next) => {
  try {
    const item = await prisma.stockItem.create({ data: { ...req.body, tenantId: req.user.tenantId } });
    res.status(201).json({ success: true, data: item });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updateStockItem = async (req, res, next) => {
  try {
    await prisma.stockItem.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: req.body });
    const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: item });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const recordTransaction = async (req, res, next) => {
  try {
    const txn = await prisma.stockTransaction.create({ data: { ...req.body, tenantId: req.user.tenantId, createdBy: req.user.id } });
    // Update stock quantity
    const item = await prisma.stockItem.findUnique({ where: { id: req.body.stockItemId } });
    const qtyChange = ['INWARD', 'RETURN'].includes(req.body.type) ? req.body.quantity : -req.body.quantity;
    await prisma.stockItem.update({ where: { id: req.body.stockItemId }, data: { quantity: item.quantity + qtyChange } });
    res.status(201).json({ success: true, data: txn });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId: req.user.tenantId },
      include: { items: { select: { id: true } } }
    });
    res.json({ success: true, data: warehouses.map(w => ({ ...w, itemCount: w.items.length, items: undefined })) });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createWarehouse = async (req, res, next) => {
  try {
    const wh = await prisma.warehouse.create({ data: { ...req.body, tenantId: req.user.tenantId } });
    res.status(201).json({ success: true, data: wh });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getStockItems, createStockItem, updateStockItem, recordTransaction, getWarehouses, createWarehouse };

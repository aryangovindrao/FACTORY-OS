const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTickets = async (req, res, next) => {
  try {
    const { status, priority, category } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    const tickets = await prisma.serviceTicket.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: tickets });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createTicket = async (req, res, next) => {
  try {
    const count = await prisma.serviceTicket.count({ where: { tenantId: req.user.tenantId } });
    const ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;
    const ticket = await prisma.serviceTicket.create({
      data: { ...req.body, tenantId: req.user.tenantId, ticketNumber, createdBy: req.user.id }
    });
    const io = req.app.get('io');
    io.to(`tenant-${req.user.tenantId}`).emit('ticket:created', ticket);
    res.status(201).json({ success: true, data: ticket });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const updateTicket = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.body.status === 'RESOLVED') updateData.resolvedAt = new Date();
    await prisma.serviceTicket.updateMany({ where: { id: req.params.id, tenantId: req.user.tenantId }, data: updateData });
    const ticket = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
    const io = req.app.get('io');
    io.to(`tenant-${req.user.tenantId}`).emit('ticket:updated', ticket);
    res.json({ success: true, data: ticket });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getTickets, createTicket, updateTicket };

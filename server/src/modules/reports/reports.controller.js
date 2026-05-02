const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getReportsData = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const [
      workOrders, machines, employees, stockItems, vendors, tickets, dispatches, batches
    ] = await Promise.all([
      prisma.workOrder.findMany({ where: { tenantId } }),
      prisma.machine.findMany({ where: { tenantId, isActive: true } }),
      prisma.employee.findMany({ where: { tenantId, isActive: true } }),
      prisma.stockItem.findMany({ where: { tenantId } }),
      prisma.vendor.findMany({ where: { tenantId } }),
      prisma.serviceTicket.findMany({ where: { tenantId } }),
      prisma.dispatchOrder.findMany({ where: { tenantId } }),
      prisma.batch.findMany({ where: { tenantId } })
    ]);

    // Production metrics
    const completedWO = workOrders.filter(w => w.status === 'COMPLETED').length;
    const totalTarget = workOrders.reduce((s, w) => s + w.targetQty, 0);
    const totalCompleted = workOrders.reduce((s, w) => s + w.completedQty, 0);
    const totalRejected = workOrders.reduce((s, w) => s + w.rejectedQty, 0);
    const fulfillmentRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    // Machine OEE (simplified)
    const runningMachines = machines.filter(m => m.status === 'RUNNING').length;
    const availability = machines.length > 0 ? Math.round((runningMachines / machines.length) * 100) : 0;
    const performance = fulfillmentRate;
    const quality = totalCompleted > 0 ? Math.round(((totalCompleted - totalRejected) / totalCompleted) * 100) : 100;
    const oee = Math.round((availability * performance * quality) / 10000);

    // Inventory value
    const inventoryValue = stockItems.reduce((s, i) => s + (i.quantity * i.unitCost), 0);
    const lowStockItems = stockItems.filter(i => i.reorderLevel > 0 && i.quantity <= i.reorderLevel).length;

    // Employee metrics
    const deptDistribution = employees.reduce((acc, e) => { acc[e.department || 'Other'] = (acc[e.department || 'Other'] || 0) + 1; return acc; }, {});
    const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0);

    // Ticket metrics
    const openTickets = tickets.filter(t => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
    const resolvedTickets = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

    // Dispatch metrics
    const deliveredDispatches = dispatches.filter(d => d.status === 'DELIVERED').length;
    const pendingDispatches = dispatches.filter(d => d.status === 'PENDING').length;

    // Work order status distribution
    const woStatusDist = workOrders.reduce((acc, w) => { acc[w.status] = (acc[w.status] || 0) + 1; return acc; }, {});

    res.json({
      success: true,
      data: {
        production: { totalWorkOrders: workOrders.length, completedWO, fulfillmentRate, totalTarget, totalCompleted, totalRejected, woStatusDist },
        oee: { overall: oee, availability, performance, quality },
        inventory: { totalItems: stockItems.length, totalValue: inventoryValue, lowStockItems },
        employees: { total: employees.length, deptDistribution, totalMonthlySalary: totalSalary },
        vendors: { total: vendors.length },
        maintenance: { total: tickets.length, open: openTickets, resolved: resolvedTickets },
        dispatch: { total: dispatches.length, delivered: deliveredDispatches, pending: pendingDispatches },
        machines: { total: machines.length, running: runningMachines, utilization: availability }
      }
    });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getReportsData };

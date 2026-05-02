const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../../middleware/authenticate');

const prisma = new PrismaClient();

router.use(authenticate);

// Live production dashboard data
router.get('/production', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const [
      totalWorkOrders,
      activeWorkOrders,
      completedToday,
      machines,
      recentBatches,
      workOrdersByStatus,
      recentQc
    ] = await Promise.all([
      prisma.workOrder.count({ where: { tenantId } }),
      prisma.workOrder.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.workOrder.count({
        where: {
          tenantId, status: 'COMPLETED',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      prisma.machine.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, code: true, status: true, type: true, department: true }
      }),
      prisma.batch.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { workOrder: { select: { orderNumber: true, productName: true } } }
      }),
      prisma.workOrder.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true }
      }),
      prisma.qcInspection.findMany({
        where: { tenantId },
        orderBy: { inspectedAt: 'desc' },
        take: 5,
        include: { workOrder: { select: { orderNumber: true, productName: true } } }
      })
    ]);

    // Calculate KPIs
    const machineUtilization = machines.length > 0
      ? Math.round((machines.filter(m => m.status === 'RUNNING').length / machines.length) * 100)
      : 0;

    const totalOutput = recentBatches.reduce((sum, b) => sum + b.outputQty, 0);
    const totalWastage = recentBatches.reduce((sum, b) => sum + b.wastageQty, 0);
    const yieldRate = totalOutput + totalWastage > 0
      ? Math.round((totalOutput / (totalOutput + totalWastage)) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          totalWorkOrders,
          activeWorkOrders,
          completedToday,
          machineUtilization,
          yieldRate,
          totalMachines: machines.length,
          runningMachines: machines.filter(m => m.status === 'RUNNING').length
        },
        machines,
        recentBatches,
        workOrdersByStatus,
        recentQc
      }
    });
  } catch (error) { next({ status: 500, message: error.message }); }
});

module.exports = router;

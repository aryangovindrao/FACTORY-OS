const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FactoryOS database...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'surat-textile-mill' },
    update: {},
    create: {
      name: 'Surat Textile Mill Pvt. Ltd.', slug: 'surat-textile-mill', schemaName: 'tenant_surat_textile',
      plan: 'enterprise', industry: 'textile', gstNumber: '24AABCS1429B1ZS',
      address: 'Plot 45, GIDC Industrial Estate', city: 'Surat', state: 'Gujarat', pincode: '395003',
      phone: '+91 261 2345678', email: 'admin@surattextile.com',
      settings: { currency: 'INR', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' }
    }
  });

  const passwordHash = await bcrypt.hash('Password@123', 12);
  const users = [
    { email: 'owner@surattextile.com', firstName: 'Rajesh', lastName: 'Patel', role: 'FACTORY_OWNER', phone: '+919876543210' },
    { email: 'manager@surattextile.com', firstName: 'Amit', lastName: 'Shah', role: 'MANAGER', phone: '+919876543211' },
    { email: 'supervisor@surattextile.com', firstName: 'Vikram', lastName: 'Singh', role: 'SUPERVISOR', phone: '+919876543212' },
    { email: 'worker@surattextile.com', firstName: 'Ramesh', lastName: 'Kumar', role: 'WORKER', phone: '+919876543213' },
    { email: 'hr@surattextile.com', firstName: 'Priya', lastName: 'Sharma', role: 'HR', phone: '+919876543214' },
    { email: 'finance@surattextile.com', firstName: 'Deepak', lastName: 'Mehta', role: 'FINANCE', phone: '+919876543215' },
    { email: 'vendor@yarnco.com', firstName: 'Suresh', lastName: 'Agarwal', role: 'VENDOR', phone: '+919876543216' },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email_tenantId: { email: u.email, tenantId: tenant.id } }, update: {}, create: { ...u, passwordHash, tenantId: tenant.id } });
  }

  // Machines
  const machineData = [
    { name: 'Power Loom A1', code: 'PL-A1', type: 'Power Loom', department: 'Weaving', status: 'RUNNING' },
    { name: 'Power Loom A2', code: 'PL-A2', type: 'Power Loom', department: 'Weaving', status: 'RUNNING' },
    { name: 'Power Loom B1', code: 'PL-B1', type: 'Power Loom', department: 'Weaving', status: 'IDLE' },
    { name: 'Dyeing Machine D1', code: 'DM-D1', type: 'Dyeing', department: 'Dyeing', status: 'RUNNING' },
    { name: 'Dyeing Machine D2', code: 'DM-D2', type: 'Dyeing', department: 'Dyeing', status: 'MAINTENANCE' },
    { name: 'Printing Unit P1', code: 'PR-P1', type: 'Printing', department: 'Printing', status: 'RUNNING' },
    { name: 'Cutting Machine C1', code: 'CT-C1', type: 'Cutting', department: 'Finishing', status: 'IDLE' },
    { name: 'Packaging Line PK1', code: 'PK-PK1', type: 'Packaging', department: 'Dispatch', status: 'RUNNING' },
  ];
  const machines = [];
  for (const m of machineData) {
    const machine = await prisma.machine.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: m.code } }, update: {}, create: { ...m, tenantId: tenant.id } });
    machines.push(machine);
  }

  // Shifts
  for (const s of [{ name: 'Morning Shift', startTime: '06:00', endTime: '14:00' }, { name: 'Afternoon Shift', startTime: '14:00', endTime: '22:00' }, { name: 'Night Shift', startTime: '22:00', endTime: '06:00' }]) {
    await prisma.shift.create({ data: { ...s, tenantId: tenant.id } }).catch(() => {});
  }

  const owner = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'FACTORY_OWNER' } });

  // Work Orders
  const workOrderData = [
    { productName: 'Cotton Saree - Bandhani', productCode: 'CS-BND-001', targetQty: 500, completedQty: 320, status: 'IN_PROGRESS', priority: 'HIGH', machineId: machines[0].id },
    { productName: 'Silk Dupatta - Patola', productCode: 'SD-PTL-002', targetQty: 200, completedQty: 200, status: 'COMPLETED', priority: 'MEDIUM', machineId: machines[1].id },
    { productName: 'Polyester Fabric Roll', productCode: 'PF-ROL-003', targetQty: 1000, completedQty: 0, status: 'SCHEDULED', priority: 'MEDIUM', machineId: machines[2].id },
    { productName: 'Dyed Cotton Fabric', productCode: 'DC-FAB-004', targetQty: 800, completedQty: 450, rejectedQty: 15, status: 'IN_PROGRESS', priority: 'HIGH', machineId: machines[3].id },
    { productName: 'Printed Curtain Material', productCode: 'PC-CUR-005', targetQty: 300, completedQty: 0, status: 'DRAFT', priority: 'LOW' },
  ];
  for (let i = 0; i < workOrderData.length; i++) {
    const orderNumber = `WO-${String(i + 1).padStart(5, '0')}`;
    await prisma.workOrder.upsert({
      where: { tenantId_orderNumber: { tenantId: tenant.id, orderNumber } }, update: {},
      create: { ...workOrderData[i], tenantId: tenant.id, orderNumber, unit: 'meters', createdBy: owner?.id, plannedStart: new Date(Date.now() - i * 86400000), plannedEnd: new Date(Date.now() + (7 - i) * 86400000) }
    });
  }

  // Employees
  const employeeData = [
    { firstName: 'Ravi', lastName: 'Patel', phone: '+919900110011', department: 'Weaving', designation: 'Loom Operator', employeeType: 'PERMANENT', salary: 18000 },
    { firstName: 'Sanjay', lastName: 'Verma', phone: '+919900110012', department: 'Weaving', designation: 'Sr. Operator', employeeType: 'PERMANENT', salary: 22000 },
    { firstName: 'Meena', lastName: 'Devi', phone: '+919900110013', department: 'Dyeing', designation: 'Dye Technician', employeeType: 'PERMANENT', salary: 20000 },
    { firstName: 'Arjun', lastName: 'Nair', phone: '+919900110014', department: 'Printing', designation: 'Print Operator', employeeType: 'CONTRACT', salary: 15000 },
    { firstName: 'Lakshmi', lastName: 'Iyer', phone: '+919900110015', department: 'Quality', designation: 'QC Inspector', employeeType: 'PERMANENT', salary: 25000 },
    { firstName: 'Mohan', lastName: 'Das', phone: '+919900110016', department: 'Finishing', designation: 'Cutter', employeeType: 'TEMPORARY', salary: 12000 },
    { firstName: 'Geeta', lastName: 'Sharma', phone: '+919900110017', department: 'Dispatch', designation: 'Packing Lead', employeeType: 'PERMANENT', salary: 19000 },
    { firstName: 'Kiran', lastName: 'Joshi', phone: '+919900110018', department: 'Maintenance', designation: 'Electrician', employeeType: 'PERMANENT', salary: 21000 },
  ];
  for (let i = 0; i < employeeData.length; i++) {
    const employeeCode = `EMP-${String(i + 1).padStart(4, '0')}`;
    await prisma.employee.upsert({
      where: { tenantId_employeeCode: { tenantId: tenant.id, employeeCode } }, update: {},
      create: { ...employeeData[i], tenantId: tenant.id, employeeCode, joinDate: new Date(2024, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)) }
    });
  }

  // Warehouses & Inventory
  const wh1 = await prisma.warehouse.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: 'WH-MAIN' } }, update: {}, create: { name: 'Main Warehouse', code: 'WH-MAIN', location: 'Building A', tenantId: tenant.id } });
  const wh2 = await prisma.warehouse.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: 'WH-FG' } }, update: {}, create: { name: 'Finished Goods Store', code: 'WH-FG', location: 'Building C', tenantId: tenant.id } });

  const stockData = [
    { name: 'Raw Cotton Yarn 40s', sku: 'RM-CY40', category: 'RAW_MATERIAL', quantity: 5000, unit: 'kg', unitCost: 280, reorderLevel: 1000, warehouseId: wh1.id },
    { name: 'Silk Thread', sku: 'RM-SLK', category: 'RAW_MATERIAL', quantity: 800, unit: 'kg', unitCost: 1200, reorderLevel: 200, warehouseId: wh1.id },
    { name: 'Reactive Dye - Blue', sku: 'RM-DYE-B', category: 'CONSUMABLE', quantity: 50, unit: 'kg', unitCost: 850, reorderLevel: 20, warehouseId: wh1.id },
    { name: 'Reactive Dye - Red', sku: 'RM-DYE-R', category: 'CONSUMABLE', quantity: 15, unit: 'kg', unitCost: 920, reorderLevel: 20, warehouseId: wh1.id },
    { name: 'Packaging Film', sku: 'RM-PKG', category: 'CONSUMABLE', quantity: 200, unit: 'rolls', unitCost: 350, reorderLevel: 50, warehouseId: wh1.id },
    { name: 'Cotton Saree - Bandhani', sku: 'FG-CS-BND', category: 'FINISHED_GOODS', quantity: 150, unit: 'pcs', unitCost: 1500, reorderLevel: 0, warehouseId: wh2.id },
    { name: 'Loom Shuttle Spare', sku: 'SP-LSHUT', category: 'SPARE_PART', quantity: 8, unit: 'pcs', unitCost: 2200, reorderLevel: 5, warehouseId: wh1.id },
  ];
  for (const s of stockData) {
    await prisma.stockItem.upsert({ where: { tenantId_sku: { tenantId: tenant.id, sku: s.sku } }, update: {}, create: { ...s, tenantId: tenant.id } });
  }

  // Vendors
  const vendorData = [
    { name: 'YarnCo Textiles', code: 'V-YARN', gstNumber: '24AABCY5678B1Z5', contactName: 'Suresh Agarwal', phone: '+919800001111', city: 'Ahmedabad', state: 'Gujarat', rating: 4 },
    { name: 'DyeMaster Chemicals', code: 'V-DYE', gstNumber: '24AABCD9012B1Z8', contactName: 'Pankaj Modi', phone: '+919800002222', city: 'Vadodara', state: 'Gujarat', rating: 3 },
    { name: 'PackWell Industries', code: 'V-PACK', gstNumber: '24AABCP3456B1Z2', contactName: 'Harsh Desai', phone: '+919800003333', city: 'Surat', state: 'Gujarat', rating: 5 },
  ];
  const vendors = [];
  for (const v of vendorData) {
    const vendor = await prisma.vendor.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: v.code } }, update: {}, create: { ...v, tenantId: tenant.id } });
    vendors.push(vendor);
  }

  // Purchase Orders
  const poData = [
    { vendorId: vendors[0].id, totalAmount: 140000, gstAmount: 25200, status: 'APPROVED', notes: 'Monthly cotton yarn supply' },
    { vendorId: vendors[1].id, totalAmount: 42500, gstAmount: 7650, status: 'PENDING_APPROVAL', notes: 'Reactive dyes quarterly order' },
    { vendorId: vendors[2].id, totalAmount: 17500, gstAmount: 3150, status: 'ORDERED', notes: 'Packaging material' },
  ];
  for (let i = 0; i < poData.length; i++) {
    const poNumber = `PO-${String(i + 1).padStart(5, '0')}`;
    await prisma.purchaseOrder.upsert({
      where: { tenantId_poNumber: { tenantId: tenant.id, poNumber } }, update: {},
      create: { ...poData[i], tenantId: tenant.id, poNumber, createdBy: owner?.id }
    });
  }

  // Service Tickets
  const ticketData = [
    { title: 'Power Loom B1 - Belt worn out', description: 'Belt needs replacement, causing uneven tension', category: 'machine', priority: 'HIGH', status: 'OPEN', slaHours: 8 },
    { title: 'Dyeing Machine D2 - Temperature sensor fault', description: 'Temp readings are inconsistent, needs calibration', category: 'machine', priority: 'CRITICAL', status: 'IN_PROGRESS', slaHours: 4 },
    { title: 'Main warehouse light fixture broken', description: 'Section B lights flickering', category: 'utility', priority: 'LOW', status: 'ASSIGNED', slaHours: 24 },
    { title: 'ERP login issue for new operator', description: 'Unable to create new user account', category: 'IT', priority: 'MEDIUM', status: 'RESOLVED', slaHours: 12 },
  ];
  for (let i = 0; i < ticketData.length; i++) {
    const ticketNumber = `TKT-${String(i + 1).padStart(5, '0')}`;
    await prisma.serviceTicket.upsert({
      where: { tenantId_ticketNumber: { tenantId: tenant.id, ticketNumber } }, update: {},
      create: { ...ticketData[i], tenantId: tenant.id, ticketNumber, createdBy: owner?.id, resolvedAt: ticketData[i].status === 'RESOLVED' ? new Date() : null }
    });
  }

  // Dispatch Orders
  const dispatchData = [
    { customerName: 'Rajkot Saree Emporium', totalQty: 100, status: 'DELIVERED', transporterName: 'Gujarat Transport Co.', vehicleNumber: 'GJ-05-AB-1234', challanNumber: 'CH-001' },
    { customerName: 'Mumbai Silk House', totalQty: 50, status: 'IN_TRANSIT', transporterName: 'Blue Dart Logistics', vehicleNumber: 'MH-01-CD-5678' },
    { customerName: 'Delhi Textile Traders', totalQty: 200, status: 'PENDING', transporterName: '', vehicleNumber: '' },
  ];
  for (let i = 0; i < dispatchData.length; i++) {
    const orderNumber = `DSP-${String(i + 1).padStart(5, '0')}`;
    await prisma.dispatchOrder.upsert({
      where: { tenantId_orderNumber: { tenantId: tenant.id, orderNumber } }, update: {},
      create: { ...dispatchData[i], tenantId: tenant.id, orderNumber, createdBy: owner?.id }
    });
  }

  console.log('✅ Seed complete with all modules!');
  console.log('📧 Login: owner@surattextile.com / Password@123');
  console.log('🏭 Tenant slug: surat-textile-mill');
}

main().catch(console.error).finally(() => prisma.$disconnect());

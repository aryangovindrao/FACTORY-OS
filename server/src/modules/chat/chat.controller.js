const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple rule-based chatbot (Claude API integration placeholder)
const RESPONSES = {
  production: async (tenantId) => {
    const [total, active, completed] = await Promise.all([
      prisma.workOrder.count({ where: { tenantId } }),
      prisma.workOrder.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.workOrder.count({ where: { tenantId, status: 'COMPLETED' } }),
    ]);
    return `📊 **Production Summary**\n- Total Work Orders: ${total}\n- Active: ${active}\n- Completed: ${completed}`;
  },
  machines: async (tenantId) => {
    const machines = await prisma.machine.findMany({ where: { tenantId, isActive: true } });
    const running = machines.filter(m => m.status === 'RUNNING').length;
    const breakdown = machines.filter(m => m.status === 'BREAKDOWN').length;
    return `🏭 **Machine Status**\n- Total: ${machines.length}\n- Running: ${running}\n- Breakdown: ${breakdown}\n- Utilization: ${machines.length ? Math.round(running/machines.length*100) : 0}%`;
  },
  inventory: async (tenantId) => {
    const items = await prisma.stockItem.findMany({ where: { tenantId } });
    const lowStock = items.filter(i => i.reorderLevel > 0 && i.quantity <= i.reorderLevel);
    const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    let msg = `📦 **Inventory Summary**\n- Total Items: ${items.length}\n- Total Value: ₹${totalValue.toLocaleString('en-IN')}`;
    if (lowStock.length > 0) msg += `\n\n⚠️ **Low Stock Alerts:**\n${lowStock.map(i => `- ${i.name} (${i.quantity} ${i.unit} remaining)`).join('\n')}`;
    return msg;
  },
  employees: async (tenantId) => {
    const total = await prisma.employee.count({ where: { tenantId, isActive: true } });
    const totalSalary = (await prisma.employee.findMany({ where: { tenantId, isActive: true }, select: { salary: true } })).reduce((s, e) => s + e.salary, 0);
    return `👥 **Employee Summary**\n- Total Active: ${total}\n- Monthly Payroll: ₹${totalSalary.toLocaleString('en-IN')}`;
  },
  tickets: async (tenantId) => {
    const open = await prisma.serviceTicket.count({ where: { tenantId, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } });
    const total = await prisma.serviceTicket.count({ where: { tenantId } });
    return `🔧 **Maintenance Tickets**\n- Total: ${total}\n- Open/In Progress: ${open}`;
  },
  dispatch: async (tenantId) => {
    const pending = await prisma.dispatchOrder.count({ where: { tenantId, status: 'PENDING' } });
    const transit = await prisma.dispatchOrder.count({ where: { tenantId, status: 'IN_TRANSIT' } });
    return `🚛 **Dispatch Status**\n- Pending: ${pending}\n- In Transit: ${transit}`;
  },
  help: async () => {
    return `🤖 **FactoryBot Help**\nI can answer questions about:\n- **production** — work order status\n- **machines** — machine utilization\n- **inventory** — stock levels & alerts\n- **employees** — workforce summary\n- **tickets** — maintenance issues\n- **dispatch** — shipment tracking\n\nJust type a keyword or ask a question!`;
  }
};

const detectIntent = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('production') || msg.includes('work order') || msg.includes('output')) return 'production';
  if (msg.includes('machine') || msg.includes('loom') || msg.includes('equipment')) return 'machines';
  if (msg.includes('inventory') || msg.includes('stock') || msg.includes('material') || msg.includes('reorder')) return 'inventory';
  if (msg.includes('employee') || msg.includes('staff') || msg.includes('worker') || msg.includes('salary') || msg.includes('payroll')) return 'employees';
  if (msg.includes('ticket') || msg.includes('maintenance') || msg.includes('repair') || msg.includes('issue')) return 'tickets';
  if (msg.includes('dispatch') || msg.includes('shipping') || msg.includes('delivery') || msg.includes('transport')) return 'dispatch';
  if (msg.includes('help') || msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) return 'help';
  return 'help';
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { tenantId: req.user.tenantId, userId: req.user.id },
      orderBy: { createdAt: 'desc' }, take: 20,
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
    });
    res.json({ success: true, data: sessions });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const createSession = async (req, res, next) => {
  try {
    const session = await prisma.chatSession.create({
      data: { tenantId: req.user.tenantId, userId: req.user.id, title: req.body.title || 'New Chat' }
    });
    // Add welcome message
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: '👋 Hello! I\'m **FactoryBot**, your factory assistant.\n\nI can help you with production status, inventory levels, machine utilization, employee info, and more.\n\nWhat would you like to know?' }
    });
    const full = await prisma.chatSession.findUnique({ where: { id: session.id }, include: { messages: true } });
    res.status(201).json({ success: true, data: full });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, content } = req.body;
    // Save user message
    await prisma.chatMessage.create({ data: { sessionId, role: 'user', content } });
    // Generate response
    const intent = detectIntent(content);
    const handler = RESPONSES[intent] || RESPONSES.help;
    const reply = await handler(req.user.tenantId);
    // Save bot reply
    const botMsg = await prisma.chatMessage.create({ data: { sessionId, role: 'assistant', content: reply } });
    // Update session title from first user message
    await prisma.chatSession.update({ where: { id: sessionId }, data: { title: content.slice(0, 50) } });
    res.json({ success: true, data: botMsg });
  } catch (e) { next({ status: 500, message: e.message }); }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: messages });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getSessions, createSession, sendMessage, getMessages };

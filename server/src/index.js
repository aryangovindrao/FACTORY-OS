require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./modules/auth/auth.routes');
const productionRoutes = require('./modules/production/production.routes');
const dashboardRoutes = require('./modules/production/dashboard.routes');
const dispatchRoutes = require('./modules/dispatch/dispatch.routes');
const employeesRoutes = require('./modules/employees/employees.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const vendorsRoutes = require('./modules/vendors/vendors.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const payrollRoutes = require('./modules/payroll/payroll.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const chatRoutes = require('./modules/chat/chat.routes');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make prisma and io available to routes
app.set('prisma', prisma);
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FactoryOS API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant-${tenantId}`);
  });
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`FactoryOS API running on port ${PORT}`);
});

module.exports = { app, io, prisma };

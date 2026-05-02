const { PrismaClient } = require('@prisma/client');
const AuthService = require('./auth.service');

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, tenantSlug } = req.body;
    if (!email || !password || !tenantSlug) {
      return res.status(400).json({ success: false, message: 'Email, password and factory slug required' });
    }
    const result = await authService.login({ email, password, tenantSlug });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, req.body.refreshToken);
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true, phone: true }
  });
  const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId } });
  res.json({ success: true, data: { user, tenant } });
};

module.exports = { register, login, refreshToken, logout, me };

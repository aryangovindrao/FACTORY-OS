const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async register({ email, password, firstName, lastName, phone, role, tenantId }) {
    const existing = await this.prisma.user.findFirst({
      where: { email, tenantId }
    });
    if (existing) {
      throw { status: 409, message: 'User already exists with this email' };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, firstName, lastName, phone, role, tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true }
    });

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async login({ email, password, tenantSlug }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      throw { status: 404, message: 'Factory not found' };
    }

    const user = await this.prisma.user.findFirst({
      where: { email, tenantId: tenant.id, isActive: true }
    });
    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const userData = {
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, role: user.role, tenantId: user.tenantId
    };
    const tokens = this.generateTokens(userData);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: userData, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug }, ...tokens };
  }

  async refreshToken(token) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true }
    });

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async logout(userId, refreshTokenValue) {
    if (refreshTokenValue) {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  generateTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId, token) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  }
}

module.exports = AuthService;

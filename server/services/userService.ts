import { type User } from '@shared/schema';
import type { RequestHandler } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from '../db';
import { auditLog } from '../utils/auditLogger';
import {
  findUserByEmail,
  hashPassword,
  verifyPassword,
} from '../utils/authUtils';

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email);

        if (!user) {
          return done(null, false, { message: 'Email ou senha inválidos.' });
        }

        // Check password
        const isValidPassword = await verifyPassword(password, user.password);

        if (!isValidPassword) {
          return done(null, false, { message: 'Email ou senha inválidos.' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  auditLog('ACCESS_DENIED', 'Acesso negado: usuário não autenticado', {
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
  });
  res
    .status(401)
    .json({
      message: 'Você precisa estar logado para acessar esta funcionalidade.',
    });
};

// Admin authorization middleware
export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as User)?.role === 'admin') {
    return next();
  }
  auditLog(
    'ACCESS_DENIED',
    'Acesso negado: usuário sem permissão de administrador',
    {
      userId: (req.user as User)?.id,
      email: (req.user as User)?.email,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
    }
  );
  res
    .status(403)
    .json({
      message:
        'Esta funcionalidade é exclusiva para administradores. Entre em contato com o responsável pelo sistema.',
    });
};

// User service functions
export const userService = {
  async hasAdmin(): Promise<boolean> {
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });
    return !!admin;
  },
  async createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<User> {
    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role || 'user',
      },
    });

    return newUser;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  async createAdminUser(): Promise<User> {
    // In production, use environment variables for initial admin
    const adminEmail =
      process.env.INITIAL_ADMIN_EMAIL || 'admin@confeitaria.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123!';

    // Check if admin already exists
    const existingAdmin = await this.getUserByEmail(adminEmail);
    if (existingAdmin) {
      return existingAdmin;
    }

    const adminUser = await this.createUser({
      email: adminEmail,
      password: adminPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'admin',
    });

    auditLog('ADMIN_CREATION', `Administrador inicial criado: ${adminEmail}`, {
      userId: adminUser.id,
      email: adminUser.email,
    });

    return adminUser;
  },

  // Promote existing user to admin (for production use)
  async promoteToAdmin(userEmail: string): Promise<User | null> {
    const user = await this.getUserByEmail(userEmail);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.role === 'admin') {
      throw new Error('Usuário já é administrador');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    });

    auditLog(
      'ADMIN_PROMOTION',
      `Usuário promovido a administrador: ${userEmail}`,
      {
        userId: updatedUser.id,
        email: updatedUser.email,
      }
    );

    console.log(`✓ User ${userEmail} promoted to admin`);
    return updatedUser;
  },

  // Create first admin via command line (production strategy)
  async initializeFirstAdmin(
    email: string,
    password: string,
    firstName: string,
    lastName?: string
  ): Promise<User> {
    // Check if any admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      throw new Error(
        'Sistema já possui um administrador. Use a função de promoção.'
      );
    }

    // Create the first admin
    const adminUser = await this.createUser({
      email,
      password,
      firstName,
      lastName: lastName,
      role: 'admin',
    });

    auditLog(
      'ADMIN_CREATION',
      `Primeiro administrador criado via CLI: ${email}`,
      {
        userId: adminUser.id,
        email: adminUser.email,
      }
    );

    console.log(`✓ First admin created: ${email}`);
    return adminUser;
  },

  async updateUser(
    userId: string,
    userData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
    }
  ): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    return updatedUser;
  },

  async updateUserPassword(
    userId: string,
    hashedPassword: string
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  },

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getUserWithPassword(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  },
};

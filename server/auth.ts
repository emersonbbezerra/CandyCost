import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users, type User, type UpsertUser } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const PgSession = connectPg(session);

// Configure Passport Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        return done(null, false, { message: 'Email não encontrado.' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Senha incorreta.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || 'confei-calc-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Setup authentication middleware
export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Você precisa estar logado para acessar esta funcionalidade." });
};

// Admin authorization middleware
export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as User)?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Esta funcionalidade é exclusiva para administradores. Entre em contato com o responsável pelo sistema." });
};

// User service functions
export const userService = {
  async createUser(userData: { email: string; password: string; firstName?: string; lastName?: string; role?: string }): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Generate unique ID
    const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const newUser: UpsertUser = {
      id: userId,
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      role: userData.role || 'user',
    };

    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async createAdminUser(): Promise<User> {
    // In production, use environment variables for initial admin
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@confeitaria.com";
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123!";
    
    // Check if admin already exists
    const existingAdmin = await this.getUserByEmail(adminEmail);
    if (existingAdmin) {
      return existingAdmin;
    }

    return this.createUser({
      email: adminEmail,
      password: adminPassword,
      firstName: "Administrador",
      lastName: "Sistema",
      role: "admin"
    });
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

    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    console.log(`✓ User ${userEmail} promoted to admin`);
    return updatedUser;
  },

  // Create first admin via command line (production strategy)
  async initializeFirstAdmin(email: string, password: string, firstName: string, lastName?: string): Promise<User> {
    // Check if any admin exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (existingAdmin) {
      throw new Error('Sistema já possui um administrador. Use a função de promoção.');
    }

    // Create the first admin
    const adminUser = await this.createUser({
      email,
      password,
      firstName,
      lastName: lastName || null,
      role: "admin"
    });

    console.log(`✓ First admin created: ${email}`);
    return adminUser;
  },

  async updateUser(userId: string, userData: { firstName?: string; lastName?: string; email?: string; role?: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    return updatedUser;
  },

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    // Update password separately using SQL
    await db.execute(sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${userId}`);
  },

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  },

  async getAllUsers(): Promise<User[]> {
    return await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);
  },

  async getUserWithPassword(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }
};
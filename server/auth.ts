import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users, type User, type UpsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";

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

      // For now, we'll store passwords in the ID field temporarily
      // This will be improved with proper password hashing
      const isValidPassword = await bcrypt.compare(password, user.id);
      
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
  res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
};

// Admin authorization middleware
export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as User)?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado. Apenas administradores têm permissão." });
};

// User service functions
export const userService = {
  async createUser(userData: { email: string; password: string; firstName?: string; lastName?: string; role?: string }): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Generate unique ID
    const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const newUser: UpsertUser = {
      id: hashedPassword, // Temporarily store password hash in ID field
      email: userData.email,
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
    const adminEmail = "admin@confeitaria.com";
    const adminPassword = "admin123!";
    
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
  }
};
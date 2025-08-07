
import dotenv from "dotenv";
dotenv.config();

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

async function createTables() {
  try {
    // Create tables using raw SQL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity DECIMAL(10, 3) NOT NULL,
        unit TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        brand TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        is_also_ingredient BOOLEAN NOT NULL DEFAULT false,
        margin_percentage DECIMAL(5, 2) NOT NULL DEFAULT 60,
        preparation_time_minutes INTEGER NOT NULL DEFAULT 60,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        ingredient_id INTEGER REFERENCES ingredients(id),
        product_ingredient_id INTEGER REFERENCES products(id),
        quantity DECIMAL(10, 3) NOT NULL,
        unit TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS fixed_costs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        recurrence TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        ingredient_id INTEGER REFERENCES ingredients(id),
        product_id INTEGER REFERENCES products(id),
        old_price DECIMAL(10, 2) NOT NULL,
        new_price DECIMAL(10, 2) NOT NULL,
        change_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        password VARCHAR NOT NULL,
        profile_image_url VARCHAR,
        role VARCHAR NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS work_configuration (
        id SERIAL PRIMARY KEY,
        work_days_per_week INTEGER NOT NULL DEFAULT 5,
        hours_per_day DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
        weeks_per_month DECIMAL(3, 1) NOT NULL DEFAULT 4.0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Insert default work configuration if not exists
    await db.execute(`
      INSERT INTO work_configuration (work_days_per_week, hours_per_day, weeks_per_month)
      SELECT 5, 8.00, 4.0
      WHERE NOT EXISTS (SELECT 1 FROM work_configuration LIMIT 1);
    `);

    console.log("Todas as tabelas foram criadas com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
  } finally {
    process.exit(0);
  }
}

createTables();

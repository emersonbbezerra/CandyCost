import * as schema from "@shared/schema";
// If you are using drizzle-orm v0.29.0 or later, use the following import:
import { drizzle } from 'drizzle-orm/node-postgres';
// If you are using an older version, you may need to use:
// import { drizzle } from 'drizzle-orm/pg-core';
import pkg from 'pg';
const { Pool } = pkg;

import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

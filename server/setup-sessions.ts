
import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./db";

async function setupSessionsTable() {
  try {
    // Drop existing sessions table if it exists
    await prisma.$executeRaw`DROP TABLE IF EXISTS sessions CASCADE`;
    
    // Create sessions table with correct structure for connect-pg-simple
    await prisma.$executeRaw`
      CREATE TABLE sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IDX_session_expire ON sessions (expire);
    `;
    
    console.log("Sessions table created successfully!");
  } catch (error) {
    console.error("Error setting up sessions table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSessionsTable();

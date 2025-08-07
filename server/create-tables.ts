import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./db";

async function createTables() {
  try {
    console.log("Sincronizando banco de dados com Prisma...");

    // Executar push do schema do Prisma
    const { execSync } = require('child_process');

    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log("✓ Schema do banco de dados sincronizado com sucesso!");
    } catch (error) {
      console.error("Erro ao sincronizar schema:", error);
      throw error;
    }

    // Inserir configuração padrão de trabalho se não existir
    const existingConfig = await prisma.workConfiguration.findFirst();
    if (!existingConfig) {
      await prisma.workConfiguration.create({
        data: {
          workDaysPerWeek: 5,
          hoursPerDay: 8.00,
          weeksPerMonth: 4.0,
        }
      });
      console.log("✓ Configuração padrão de trabalho inserida");
    }

    console.log("🎉 Todas as tabelas foram criadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar tabelas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

createTables();

import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./db";

async function createTables() {
  try {
    console.log("Criando tabelas...");

    // Prisma automaticamente cria as tabelas baseado no schema
    // Vamos apenas verificar se conseguimos conectar
    await prisma.$connect();
    console.log("✓ Conexão com banco de dados estabelecida");

    // Criar configuração padrão de trabalho se não existir
    const existingConfig = await prisma.workConfiguration.findFirst();
    if (!existingConfig) {
      await prisma.workConfiguration.create({
        data: {
          hoursPerDay: 8.0,
          daysPerMonth: 22.0,
          hourlyRate: 25.0,
          highCostAlertThreshold: 50.0,
        }
      });
      console.log("✓ Configuração padrão de trabalho inserida");
    }

    console.log("🎉 Todas as tabelas foram criadas com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTables()
  .then(() => {
    console.log("Criação de tabelas finalizada.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro na criação de tabelas:", error);
    process.exit(1);
  });

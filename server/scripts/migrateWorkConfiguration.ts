/**
 * Script de migração para preencher os campos de dias da semana
 * baseado na configuração existente
 */
import { PrismaClient } from '@prisma/client';
import {
  calculateWorkingDays,
  convertLegacyConfiguration,
} from '../utils/workingDaysCalculator';

const prisma = new PrismaClient();

async function migrateWorkConfiguration() {
  try {
    console.log('🔄 Iniciando migração de configuração de trabalho...');

    // Buscar configuração existente
    const existingConfig = await prisma.workConfiguration.findFirst();

    if (!existingConfig) {
      console.log(
        'ℹ️ Nenhuma configuração encontrada. Será criada uma configuração padrão.'
      );
      return;
    }

    // Verificar se já possui os novos campos preenchidos
    if (existingConfig.workMonday !== null) {
      console.log('✅ Configuração já migrada. Pulando migração.');
      return;
    }

    console.log(
      `📊 Configuração atual: ${existingConfig.daysPerMonth} dias/mês, ${existingConfig.hoursPerDay} horas/dia`
    );

    // Converter configuração antiga para nova
    const newConfig = convertLegacyConfiguration(
      existingConfig.daysPerMonth,
      existingConfig.hoursPerDay
    );

    // Calcular campos derivados
    const calculations = calculateWorkingDays(newConfig);

    // Atualizar configuração
    const updatedConfig = await prisma.workConfiguration.update({
      where: { id: existingConfig.id },
      data: {
        // Configuração de dias da semana
        workMonday: newConfig.workMonday,
        workTuesday: newConfig.workTuesday,
        workWednesday: newConfig.workWednesday,
        workThursday: newConfig.workThursday,
        workFriday: newConfig.workFriday,
        workSaturday: newConfig.workSaturday,
        workSunday: newConfig.workSunday,

        // Campos calculados
        annualWorkingDays: calculations.annualWorkingDays,
        annualWorkingHours: calculations.annualWorkingHours,
        monthlyWorkingHours: calculations.monthlyWorkingHours,

        updatedAt: new Date(),
      },
    });

    console.log('✅ Migração concluída com sucesso!');
    console.log(`📈 Nova configuração:`);
    console.log(
      `   - Dias de trabalho: ${Object.entries(newConfig)
        .filter(([key, value]) => key.startsWith('work') && value)
        .map(([key]) => key.replace('work', '').substring(0, 3))
        .join(', ')}`
    );
    console.log(`   - Horas por dia: ${newConfig.hoursPerDay}`);
    console.log(
      `   - Dias de trabalho por ano: ${calculations.annualWorkingDays}`
    );
    console.log(
      `   - Horas de trabalho por ano: ${calculations.annualWorkingHours}`
    );
    console.log(
      `   - Horas médias por mês: ${calculations.monthlyWorkingHours.toFixed(
        1
      )}`
    );
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração se este arquivo for executado diretamente
if (require.main === module) {
  migrateWorkConfiguration()
    .then(() => {
      console.log('🎉 Migração finalizada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na migração:', error);
      process.exit(1);
    });
}

export { migrateWorkConfiguration };

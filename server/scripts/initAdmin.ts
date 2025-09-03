import 'dotenv/config';
import { prisma } from '../db';
import { userService } from '../services/userService';

async function main() {
  try {
    await prisma.$connect();

    // Se já existe QUALQUER admin, não faz nada (idempotente)
    const exists = await userService.hasAdmin();
    if (exists) {
      console.log('✓ Já existe um administrador — nada a fazer');
      return;
    }

    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const firstName = process.env.INITIAL_ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.INITIAL_ADMIN_LAST_NAME || 'User';

    if (!email || !password) {
      throw new Error(
        'Variáveis de ambiente INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD são obrigatórias para criar o primeiro admin.'
      );
    }

    const admin = await userService.initializeFirstAdmin(
      email,
      password,
      firstName,
      lastName
    );
    console.log(`✓ Primeiro admin criado: ${admin.email}`);
  } catch (err) {
    console.error('❌ Falha ao garantir admin inicial:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

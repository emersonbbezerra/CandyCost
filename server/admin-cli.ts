#!/usr/bin/env node

/**
 * CandyCost Admin CLI
 * Ferramenta de linha de comando para gerenciamento administrativo seguro
 * 
 * Uso em produção:
 * - npm run admin:create-first admin@empresa.com senhaSegura123! "João Silva"
 * - npm run admin:promote usuario@empresa.com
 * - npm run admin:list-users
 */

import { userService } from './auth';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const command = process.argv[2];
const args = process.argv.slice(3);

async function createFirstAdmin() {
  const [email, password, firstName, lastName] = args;
  
  if (!email || !password || !firstName) {
    console.error('❌ Uso: npm run admin:create-first <email> <senha> <nome> [sobrenome]');
    console.error('   Exemplo: npm run admin:create-first admin@confeitaria.com MinhaSenh@123! "João Silva"');
    process.exit(1);
  }

  // Validação básica de email
  if (!email.includes('@') || !email.includes('.')) {
    console.error('❌ Email inválido');
    process.exit(1);
  }

  // Validação de senha forte
  if (password.length < 8) {
    console.error('❌ Senha deve ter pelo menos 8 caracteres');
    process.exit(1);
  }

  try {
    const admin = await userService.initializeFirstAdmin(email, password, firstName, lastName);
    console.log(`✅ Primeiro administrador criado com sucesso!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nome: ${admin.firstName} ${admin.lastName || ''}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);
    console.log('');
    console.log('🔒 IMPORTANTE: Guarde essas credenciais com segurança!');
    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

async function promoteUser() {
  const [email] = args;
  
  if (!email) {
    console.error('❌ Uso: npm run admin:promote <email>');
    console.error('   Exemplo: npm run admin:promote usuario@confeitaria.com');
    process.exit(1);
  }

  try {
    const user = await userService.promoteToAdmin(email);
    console.log(`✅ Usuário promovido a administrador!`);
    console.log(`   Email: ${user!.email}`);
    console.log(`   Nome: ${user!.firstName} ${user!.lastName || ''}`);
    console.log(`   Role: ${user!.role}`);
    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

async function listUsers() {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt
    }).from(users);

    console.log('📋 Usuários do sistema:');
    console.log('');
    
    allUsers.forEach((user, index) => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      console.log(`${index + 1}. ${roleIcon} ${user.firstName} ${user.lastName || ''}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Criado: ${user.createdAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });
    
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    const userCount = allUsers.filter(u => u.role === 'user').length;
    
    console.log(`📊 Resumo: ${adminCount} admin(s), ${userCount} usuário(s) comum(ns)`);
    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

async function showHelp() {
  console.log('🍭 CandyCost Admin CLI - Comandos disponíveis:');
  console.log('');
  console.log('  create-first  - Criar primeiro administrador (apenas se não existir nenhum)');
  console.log('  promote      - Promover usuário existente a administrador');
  console.log('  list-users   - Listar todos os usuários do sistema');
  console.log('  help         - Mostrar esta ajuda');
  console.log('');
  console.log('Exemplos:');
  console.log('  npm run admin:create-first admin@confeitaria.com MinhaSenh@123! "João Silva"');
  console.log('  npm run admin:promote usuario@confeitaria.com');
  console.log('  npm run admin:list-users');
  process.exit(0);
}

// Executar comando
switch (command) {
  case 'create-first':
    createFirstAdmin();
    break;
  case 'promote':
    promoteUser();
    break;
  case 'list-users':
    listUsers();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error('❌ Comando não reconhecido. Use "help" para ver os comandos disponíveis.');
    process.exit(1);
}
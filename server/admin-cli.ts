import dotenv from 'dotenv';
import readline from 'readline';
import { userService } from './services/userService';
import { prisma } from "./db";

dotenv.config();

const command = process.argv[2];
const args = process.argv.slice(3);

// Função para promover usuário via CLI interativo
async function promoteUserCli(email: string) {
  if (!email) {
    console.error('❌ Email não informado.');
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

async function createFirstAdmin() {
  let email, password, firstName, lastName;
  if (process.env.NODE_ENV === 'development') {
    email = process.env.INITIAL_ADMIN_EMAIL;
    password = process.env.INITIAL_ADMIN_PASSWORD;
    firstName = process.env.INITIAL_ADMIN_FIRST_NAME || 'Admin';
    lastName = process.env.INITIAL_ADMIN_LAST_NAME || '';
    if (!email || !password || !firstName) {
      console.error(
        '❌ Variáveis de ambiente para admin não encontradas (.env).'
      );
      process.exit(1);
    }
    console.log('ℹ️ Criando admin usando variáveis do .env...');
    await executeCreateAdmin(email, password, firstName, lastName);
  } else {
    // Validação antes das perguntas interativas
    const hasAdmin = await userService.hasAdmin();
    if (hasAdmin) {
      console.log('❌ Erro: Sistema já possui um administrador.');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(
        'Deseja promover um usuário existente a administrador? (s/n): ',
        (answer) => {
          if (
            answer.trim().toLowerCase() === 's' ||
            answer.trim().toLowerCase() === 'sim'
          ) {
            rl.question(
              'Informe o email do usuário a ser promovido: ',
              async (emailPromote) => {
                rl.close();
                promoteUserCli(emailPromote);
              }
            );
          } else {
            console.log('Operação cancelada.');
            rl.close();
            process.exit(0);
          }
        }
      );
      return;
    }
    // Produção: perguntar interativamente
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    interface AskFunction {
      (q: string): Promise<string>;
    }
    const ask: AskFunction = (q) =>
      new Promise<string>((res) => rl.question(q, res));
    email = await ask('Email do administrador: ');
    password = await ask('Senha do administrador: ');
    firstName = await ask('Nome: ');
    lastName = await ask('Sobrenome (opcional): ');
    rl.close();
    await executeCreateAdmin(email, password, firstName, lastName);
  }
}

async function executeCreateAdmin(
  email: string,
  password: string,
  firstName: string,
  lastName?: string
) {
  if (!email || !password || !firstName) {
    console.error('❌ Dados obrigatórios ausentes.');
    process.exit(1);
  }
  if (!email.includes('@') || !email.includes('.')) {
    console.error('❌ Email inválido');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ Senha deve ter pelo menos 8 caracteres');
    process.exit(1);
  }
  try {
    const admin = await userService.initializeFirstAdmin(
      email,
      password,
      firstName,
      lastName
    );
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
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('📋 Usuários do sistema:');
    console.log('');

    allUsers.forEach((user, index) => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      const createdAtStr = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('pt-BR')
        : 'Data não disponível';
      console.log(
        `${index + 1}. ${roleIcon} ${user.firstName} ${user.lastName || ''}`
      );
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Criado: ${createdAtStr}`);
      console.log('');
    });

    const adminCount = allUsers.filter((u) => u.role === 'admin').length;
    const userCount = allUsers.filter((u) => u.role !== 'admin').length;

    console.log(
      `📊 Resumo: ${adminCount} admin(s), ${userCount} usuário(s) comum(ns)`
    );
    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

async function showHelp() {
  console.log('🍭 CandyCost Admin CLI - Comandos disponíveis:');
  console.log('');
  console.log(
    '  create-first  - Criar primeiro administrador (apenas se não existir nenhum)'
  );
  console.log('  promote      - Promover usuário existente a administrador');
  console.log('  list-users   - Listar todos os usuários do sistema');
  console.log('  help         - Mostrar esta ajuda');
  console.log('');
  console.log('Exemplos:');
  console.log(
    '  npm run admin:create-first admin@confeitaria.com MinhaSenh@123! "João Silva"'
  );
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
    console.error(
      '❌ Comando não reconhecido. Use "help" para ver os comandos disponíveis.'
    );
    process.exit(1);
}
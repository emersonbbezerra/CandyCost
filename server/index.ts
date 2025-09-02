import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { setupApp, setupViteIfDev } from './app';
import { prisma } from './db';
import { log } from './vite';

(async () => {
  try {
    await prisma.$connect();
    log('Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error(
      'Falha ao conectar ao banco de dados. Verifique se o serviço está ativo e a string de conexão está correta.'
    );
    console.error(error);
    process.exit(1);
  }

  const app = await setupApp();
  const server = http.createServer(app);

  await setupViteIfDev(app, server);

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();

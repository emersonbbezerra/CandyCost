# CandyCost - Guia de Segurança para Produção

## Estratégias para Gerenciamento de Usuários Administrativos em Produção

### ❌ Problema Identificado
- **Credenciais hardcoded**: Email e senha padrão visíveis no código (`admin@confeitaria.com / admin123!`)
- **Risco de segurança**: Qualquer pessoa com acesso ao código pode obter credenciais administrativas
- **Vulnerabilidade**: Não adequado para ambiente de produção

### ✅ Soluções Implementadas

## 1. Variáveis de Ambiente

### Configuração de Admin Inicial
```bash
# No arquivo .env de produção
INITIAL_ADMIN_EMAIL=seu-admin@empresa.com
INITIAL_ADMIN_PASSWORD=SuaSenhaSegura123!
```

### Funcionamento
- Se as variáveis não estão definidas, usa valores padrão apenas em desenvolvimento
- Em produção, **sempre** use variáveis de ambiente personalizadas
- O admin só é criado se não existir nenhum usuário admin no sistema

## 2. Interface Administrativa Web

### Funcionalidades Disponíveis
- **Página de Gerenciamento de Usuários** (`/user-management`)
- **Promoção de Usuários**: Transformar usuário comum em administrador
- **Listagem Completa**: Ver todos os usuários do sistema
- **Controle de Acesso**: Apenas administradores podem acessar

### Como Usar
1. Usuário comum se cadastra normalmente no sistema
2. Administrador acessa `/user-management`
3. Digite o email do usuário e clique em "Promover"
4. Usuário ganha privilégios administrativos imediatamente

## 3. API Administrativa

### Rotas Protegidas
```typescript
POST /api/admin/promote-user    // Promover usuário
GET  /api/admin/users          // Listar usuários
PUT  /api/admin/users/:userId  // Atualizar usuário
PUT  /api/admin/users/:userId/reset-password  // Resetar senha do usuário
DELETE /api/admin/users/:userId  // Excluir usuário
```

### Segurança
- Requer autenticação (`isAuthenticated`)
- Requer papel de administrador (`isAdmin`)
- Middleware duplo de proteção

## 4. CLI Administrativo (Linha de Comando)

### Comandos Disponíveis
```bash
# Criar primeiro admin (apenas se não existir nenhum)
tsx server/admin-cli.ts create-first admin@empresa.com MinhaSenh@123! "João Silva"

# Promover usuário existente
tsx server/admin-cli.ts promote usuario@empresa.com

# Listar todos os usuários
tsx server/admin-cli.ts list-users

# Ajuda
tsx server/admin-cli.ts help
```

### Características de Segurança
- **Validação de senha**: Mínimo 8 caracteres
- **Validação de email**: Formato correto obrigatório
- **Proteção contra duplicação**: Não permite criar admin se já existe
- **Feedback detalhado**: Mensagens claras sobre erros e sucessos

## 5. Estratégias Recomendadas para Produção

### Estratégia A: Admin via Variáveis de Ambiente
```bash
# 1. Configure as variáveis no servidor
export INITIAL_ADMIN_EMAIL="admin@suaempresa.com"
export INITIAL_ADMIN_PASSWORD="SenhaComplexaESegura123!"

# 2. Inicie a aplicação
npm start

# 3. O admin será criado automaticamente na primeira execução
```

### Estratégia B: Admin via Interface Web
```bash
# 1. Usuário administrador se cadastra como usuário comum
# 2. Acesse o servidor via SSH/terminal
# 3. Execute o comando de promoção
tsx server/admin-cli.ts promote admin@suaempresa.com

# 4. Usuário agora é administrador
```

### Estratégia C: Primeiro Admin via CLI
```bash
# 1. Acesse o servidor diretamente
# 2. Execute comando de criação
tsx server/admin-cli.ts create-first admin@empresa.com "SenhaSegura123!" "Nome Admin"

# 3. Admin criado e pronto para uso
```

---

## 📋 Recomendação para Implantação Segura do Admin Inicial

Para garantir segurança e facilidade na implantação em produção, recomendamos a seguinte abordagem:

- Utilize a **Estratégia A: Admin via Variáveis de Ambiente** como método padrão para provisionar o primeiro administrador.
- Configure as variáveis `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` no ambiente do servidor antes de iniciar a aplicação.
- Isso evita exposição de credenciais no código e permite automação em ambientes de produção.
- O comando CLI para criação do primeiro admin (`create-first`) deve ser usado apenas para casos excepcionais, como recuperação ou administração direta.
- Documente e proteja as variáveis de ambiente para evitar vazamento de credenciais.
- Realize auditoria e monitore logs para acompanhar a criação e promoção de administradores.

---

## 🛠 Script para Facilitar Configuração em Produção

Criamos um script bash para facilitar a configuração das variáveis de ambiente e iniciar a aplicação:

```bash
#!/bin/bash
# Script para configurar variáveis de ambiente para o admin inicial e iniciar a aplicação CandyCost

# Verifica se as variáveis estão definidas
if [ -z "$INITIAL_ADMIN_EMAIL" ]; then
  echo "Por favor, defina a variável INITIAL_ADMIN_EMAIL"
  exit 1
fi

if [ -z "$INITIAL_ADMIN_PASSWORD" ]; then
  echo "Por favor, defina a variável INITIAL_ADMIN_PASSWORD"
  exit 1
fi

echo "Variáveis de ambiente definidas:"
echo "INITIAL_ADMIN_EMAIL=$INITIAL_ADMIN_EMAIL"
echo "INITIAL_ADMIN_PASSWORD=********"

# Exporta as variáveis para o ambiente atual
export INITIAL_ADMIN_EMAIL
export INITIAL_ADMIN_PASSWORD

# Inicia a aplicação
echo "Iniciando a aplicação CandyCost..."
npm run build && npm start
```

Para usar o script:

1. Defina as variáveis no ambiente ou no arquivo `.env`.
2. Execute o script: `bash scripts/setup-admin.sh`
3. A aplicação será iniciada com o admin inicial configurado automaticamente.

Essa abordagem garante segurança, automação e alinhamento com as melhores práticas para produção.

npm run build && npm start

## 6. Melhores Práticas de Segurança

### Senhas Administrativas
- **Mínimo**: 12 caracteres
- **Complexidade**: Maiúsculas, minúsculas, números e símbolos
- **Exemplo bom**: `Admin$2025!Candy`
- **Exemplo ruim**: `admin123`

### Gestão de Acesso
1. **Princípio do menor privilégio**: Apenas pessoas necessárias devem ser admin
2. **Auditoria regular**: Revisar lista de administradores mensalmente
3. **Rotação de senhas**: Alterar senhas administrativas periodicamente
4. **Monitoramento**: Acompanhar ações administrativas via logs de auditoria detalhados

### Configuração do Servidor
```bash
# Variáveis de ambiente essenciais
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=chave_super_secreta_e_aleatoria
INITIAL_ADMIN_EMAIL=admin@empresa.com
INITIAL_ADMIN_PASSWORD=senha_complexa_e_segura

# NUNCA faça isso em produção:
# INITIAL_ADMIN_PASSWORD=123456
# SESSION_SECRET=mysecret
```

## 7. Verificação de Segurança

### Checklist Pré-Produção
- [ ] Variáveis de ambiente configuradas
- [ ] Senhas administrativas complexas
- [ ] Credenciais padrão removidas do código (usadas apenas como fallback em desenvolvimento)
- [ ] Acesso à interface administrativa testado
- [ ] CLI administrativo testado
- [ ] Logs de auditoria funcionando e registrando eventos críticos

### Testes de Segurança
```bash
# Verificar se admin padrão NÃO existe
curl -X POST /api/auth/login -d '{"email":"admin@confeitaria.com","password":"admin123!"}'

# Deve retornar erro 401 se a segurança está correta
```

## 8. Monitoramento e Auditoria

### Logs Administrativos
- Todas as ações de promoção são logadas em arquivo de auditoria
- Login/logout de administradores registrados com detalhes de IP e usuário
- Tentativas de acesso negadas são monitoradas e registradas

### Alertas Recomendados
- Criação de novos administradores
- Falhas consecutivas de login
- Acesso a rotas administrativas

---

## 🚀 Implantação Segura - Passo a Passo

### 1. Preparação do Ambiente
```bash
# Configure as variáveis seguras
export INITIAL_ADMIN_EMAIL="seu-admin@empresa.com"
export INITIAL_ADMIN_PASSWORD="SuaSenhaComplexa2025!"
export SESSION_SECRET="chave-aleatoria-super-secreta-64chars-minimo"
export DATABASE_URL="postgresql://usuario:senha@servidor:5432/candycost"
```

### 2. Deploy da Aplicação
```bash
# Build e start
npm run build
npm start
```

### 3. Verificação Pós-Deploy
```bash
# Teste login admin
curl -X POST https://seu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-admin@empresa.com","password":"SuaSenhaComplexa2025!"}'

# Deve retornar status 200 com dados do usuário
```

### 4. Criação de Usuários Adicionais
```bash
# Via CLI no servidor
tsx server/admin-cli.ts promote gerente@empresa.com

# Ou via interface web em /user-management
```

---

## 📞 Suporte e Dúvidas

Se você encontrar problemas durante a implantação:

1. **Verifique os logs**: `npm run dev` em desenvolvimento
2. **Teste as APIs**: Use curl ou Postman para testar endpoints
3. **Valide configurações**: Confirme todas as variáveis de ambiente
4. **Interface administrativa**: Acesse `/user-management` como admin

O sistema foi projetado com múltiplas camadas de segurança para garantir operação segura em produção.
INITIAL_ADMIN_PASSWORD=SuaSenhaSegura123!

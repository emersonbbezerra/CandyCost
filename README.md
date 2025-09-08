# 🍰 CandyCost - Sistema de Gestão de Custos para Confeitarias

CandyCost é uma aplicação web completa desenvolvida especialmente para confeiteiros e pequenos empreendedores do ramo de doces e confeitaria. O sistema oferece uma solução integrada para gerenciamento de ingredientes, cálculo de custos de produção, controle de receitas e análise de rentabilidade.

## 📋 Índice

- [Características Principais](#-características-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Deploy em Produção](#-deploy-em-produção)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🌟 Características Principais

### Gestão Completa de Custos

- **Cálculo Automático de Custos**: Sistema inteligente que calcula automaticamente o custo de produção baseado nos ingredientes utilizados
- **Conversão de Unidades**: Suporte completo para diferentes unidades de medida (kg, g, L, mL, unidades, dúzias, etc.)
- **Custos Fixos Proporcionais**: Inclusão de custos fixos baseados no tempo de preparo de cada produto
- **Margem de Lucro Inteligente**: Cálculo automático de preços sugeridos baseado na margem desejada

### Controle de Ingredientes

- **Cadastro Completo**: Nome, categoria, quantidade, unidade, preço e marca
- **Histórico de Preços**: Rastreamento automático de alterações de preço dos ingredientes
- **Alertas de Custos**: Notificações quando ingredientes excedem limites de custo configurados
- **Sistema de Categorias**: Organização por categorias (Laticínios, Farinhas, Açúcares, Chocolates, etc.)

### Gestão de Produtos e Receitas

- **Produtos Complexos**: Suporte a produtos que podem ser usados como ingredientes em outros produtos
- **Receitas Flexíveis**: Combinação de ingredientes simples e produtos como componentes
- **Rendimento Configurável**: Controle preciso do rendimento final de cada produto
- **Tempo de Preparo**: Registro do tempo necessário para produção

### Dashboard e Relatórios

- **Visão Geral Interativa**: Dashboard com estatísticas em tempo real
- **Gráficos de Evolução**: Análise visual da evolução de custos ao longo do tempo
- **Filtros Avançados**: Filtragem por categorias, datas e tipos de produtos
- **Exportação de Dados**: Relatórios em CSV e JSON com dados completos

## 🚀 Tecnologias Utilizadas

### Frontend

- **React 19.1.1** - Biblioteca principal para interface de usuário
- **TypeScript 5.9.2** - Tipagem estática para melhor desenvolvimento
- **Vite 7.1.0** - Build tool moderna e rápida
- **TailwindCSS 4.1.11** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **React Hook Form** - Gerenciamento de formulários
- **TanStack Query** - Gerenciamento de estado servidor
- **Recharts** - Biblioteca de gráficos
- **Framer Motion** - Animações e transições
- **Wouter** - Roteamento leve para React

### Backend

- **Node.js** - Runtime JavaScript no servidor
- **Express.js** - Framework web minimalista
- **TypeScript** - Tipagem estática no backend
- **Prisma** - ORM moderno para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **Passport.js** - Autenticação de usuários
- **BCrypt** - Hash de senhas
- **Express Session** - Gerenciamento de sessões
- **Zod** - Validação de esquemas

### Ferramentas de Desenvolvimento

- **ESBuild** - Bundler super rápido para produção
- **Prisma Studio** - Interface visual para o banco
- **TSX** - Executor TypeScript para desenvolvimento

## 📋 Pré-requisitos

- **Node.js** 18.0.0 ou superior
- **PostgreSQL** 12.0 ou superior
- **npm** ou **yarn** para gerenciamento de dependências

## 🔧 Instalação e Configuração

### 1. Clone o Repositório

```bash
git clone https://github.com/emersonbbezerra/CandyCost.git
cd CandyCost
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/candycost"

# Session Secret (use uma string aleatória segura)
SESSION_SECRET="sua_chave_secreta_super_segura_aqui"

# Bcrypt Rounds (opcional, padrão: 12)
BCRYPT_SALT_ROUNDS=12

# Ambiente
NODE_ENV=development
```

### 4. Configure o Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Popular com dados iniciais (opcional)
npm run seed
```

### 5. Inicialize o Primeiro Administrador

```bash
# Via script interativo (recomendado para produção)
npx tsx server/scripts/initAdmin.ts
```

## 📜 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar backend em modo desenvolvimento
npm run dev:backend

# Iniciar frontend em modo desenvolvimento
npm run dev:frontend

# Ambos podem ser executados simultaneamente em terminais separados
```

### Build e Produção

```bash
# Build completo (frontend + backend)
npm run build

# Build apenas frontend
npm run build:frontend

# Build apenas backend
npm run build:backend

# Iniciar em produção (com migrações e admin)
npm run start:prod

# Iniciar em produção (com migrações e seed)
npm run start

# Apenas iniciar backend buildado
npm run start:backend
```

### Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar migrações em desenvolvimento
npm run db:migrate

# Aplicar migrações em produção
npm run db:migrate:deploy

# Reset completo do banco (CUIDADO!)
npm run db:reset

# Abrir Prisma Studio
npm run db:studio

# Popular banco com dados de exemplo
npm run seed
```

### Utilitários

```bash
# Verificação de tipos TypeScript
npm run typecheck
```

## 🎯 Funcionalidades

### 🔐 Sistema de Autenticação

- **Registro de Usuários**: Cadastro com validação de senha forte
- **Login Seguro**: Autenticação via email e senha com sessões
- **Níveis de Acesso**: Sistema de roles (admin/user) para controle de permissões
- **Gestão de Perfil**: Atualização de dados pessoais e alteração de senha

### 🥘 Gestão de Ingredientes

- **CRUD Completo**: Criação, visualização, edição e exclusão
- **Categorização**: 11 categorias predefinidas (Laticínios, Farinhas, Açúcares, etc.)
- **Múltiplas Unidades**: kg, g, L, mL, unidades, dúzias, xícaras, colheres
- **Cálculo de Custo Unitário**: Preço por unidade calculado automaticamente
- **Histórico de Alterações**: Rastreamento de mudanças de preço

### 🧁 Gestão de Produtos

- **Produtos Complexos**: Produtos que podem ser ingredientes de outros
- **Sistema de Receitas**: Combinação flexível de ingredientes e produtos
- **Cálculo de Rendimento**: Controle preciso da quantidade produzida
- **Tempo de Preparo**: Para cálculo de custos fixos proporcionais
- **Margem Configurável**: Definição individual de margem por produto

### 💰 Controle de Custos Fixos

- **Categorias Definidas**: Aluguel, Energia, Internet, Funcionários, etc.
- **Múltiplas Recorrências**: Mensal, trimestral e anual
- **Rateio Inteligente**: Distribuição proporcional ao tempo de preparo
- **Ativação/Desativação**: Controle de quais custos incluir no cálculo

### 📊 Dashboard e Análises

- **Estatísticas em Tempo Real**:

  - Total de ingredientes e produtos
  - Custo médio por categoria
  - Produtos mais/menos rentáveis
  - Alertas de custos elevados

- **Gráficos Interativos**:

  - Evolução de custos ao longo do tempo
  - Distribuição por categorias
  - Comparativo de margens

- **Filtros Avançados**:
  - Por categoria de ingrediente/produto
  - Por período (7, 30, 90 dias)
  - Por tipo de alteração

### 📈 Histórico de Preços

- **Rastreamento Automático**: Registro de todas as alterações
- **Múltiplos Tipos de Mudança**:

  - Manual (alteração direta)
  - Por ingrediente (efeito cascata)
  - Por receita (modificação de fórmula)
  - Inicial (dados do seed)

- **Análise de Impacto**: Visualização do efeito de mudanças nos custos finais

### 📄 Relatórios e Exportação

- **Formatos Múltiplos**: CSV, JSON
- **Relatórios Específicos**:
  - Ingredientes completos
  - Produtos com custos
  - Histórico de alterações
  - Relatório completo consolidado

### ⚙️ Configurações do Sistema

- **Configuração de Trabalho**:
  - Horas por dia
  - Dias da semana trabalhados
  - Cálculo automático de horas mensais/anuais
- **Alertas Personalizáveis**:

  - Limiar de custo alto
  - Porcentagem de aumento de preço
  - Habilitação/desabilitação de notificações

- **Backup e Restauração**:
  - Exportação completa dos dados
  - Importação com validação
  - Histórico de operações

### 👥 Gestão de Usuários (Admin)

- **Controle de Acesso**: Promoção de usuários a administrador
- **Gerenciamento**: Visualização, edição e exclusão de contas
- **Auditoria**: Log de todas as operações importantes

## 🏗️ Estrutura do Projeto

```
CandyCost/
├── client/                    # Frontend React
│   ├── public/               # Arquivos estáticos
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── ui/          # Componentes UI base (Radix)
│   │   │   ├── backup-restore.tsx
│   │   │   ├── cost-alerts.tsx
│   │   │   ├── cost-evolution-chart.tsx
│   │   │   ├── export-reports.tsx
│   │   │   └── ...
│   │   ├── contexts/         # Contextos React
│   │   ├── hooks/           # Hooks customizados
│   │   ├── lib/             # Utilitários e configurações
│   │   ├── pages/           # Páginas da aplicação
│   │   └── App.tsx          # Componente principal
├── server/                   # Backend Express
│   ├── controllers/         # Controladores das rotas
│   ├── middlewares/         # Middlewares customizados
│   ├── repositories/        # Camada de acesso aos dados
│   ├── routes/             # Definição das rotas
│   ├── services/           # Lógica de negócio
│   ├── scripts/            # Scripts de utilidade
│   ├── utils/              # Utilitários
│   └── app.ts              # Configuração do Express
├── shared/                  # Código compartilhado
│   ├── constants.ts        # Constantes da aplicação
│   ├── schema.ts          # Esquemas Zod compartilhados
│   └── passwordValidation.ts
├── prisma/                  # Configuração do Prisma
│   ├── migrations/         # Migrações do banco
│   └── schema.prisma       # Schema do banco
├── logs/                   # Logs da aplicação
└── package.json           # Dependências e scripts
```

## 🔌 API Endpoints

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Dados do usuário atual

### Ingredientes

- `GET /api/ingredients` - Listar ingredientes
- `POST /api/ingredients` - Criar ingrediente
- `GET /api/ingredients/:id` - Buscar ingrediente
- `PUT /api/ingredients/:id` - Atualizar ingrediente
- `DELETE /api/ingredients/:id` - Excluir ingrediente

### Produtos

- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/:id` - Buscar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto
- `GET /api/products/:id/cost` - Calcular custo do produto

### Receitas

- `GET /api/products/:id/recipes` - Listar receitas do produto
- `POST /api/products/:id/recipes` - Criar/atualizar receitas
- `DELETE /api/recipes/:id` - Excluir receita

### Custos Fixos

- `GET /api/fixed-costs` - Listar custos fixos
- `POST /api/fixed-costs` - Criar custo fixo
- `PUT /api/fixed-costs/:id` - Atualizar custo fixo
- `DELETE /api/fixed-costs/:id` - Excluir custo fixo

### Histórico de Preços

- `GET /api/price-history` - Listar histórico
- `POST /api/price-history` - Criar entrada no histórico

### Dashboard

- `GET /api/dashboard/stats` - Estatísticas do dashboard
- `GET /api/dashboard/recent-updates` - Atualizações recentes

### Relatórios

- `GET /api/reports/export` - Exportar dados

### Configurações

- `GET /api/settings` - Buscar configurações
- `POST /api/settings` - Atualizar configurações

### Usuários (Admin)

- `GET /api/users` - Listar usuários (admin)
- `POST /api/admin/promote-user` - Promover usuário (admin)
- `PUT /api/user/profile` - Atualizar perfil
- `PUT /api/user/change-password` - Alterar senha

## 🗄️ Banco de Dados

### Tabelas Principais

#### `users`

Usuários do sistema com autenticação e roles.

#### `ingredients`

Ingredientes com preço, quantidade, unidade e categoria.

#### `products`

Produtos finais com margem, rendimento e tempo de preparo.

#### `recipes`

Relacionamento entre produtos e seus ingredientes/componentes.

#### `fixed_costs`

Custos fixos com valores e recorrência.

#### `price_history`

Histórico de alterações de preços para auditoria.

#### `work_configuration`

Configurações de trabalho para cálculo de custos fixos.

#### `sessions`

Sessões de usuário para autenticação.

### Relacionamentos

- Produtos podem ter múltiplas receitas (ingredientes)
- Produtos podem usar outros produtos como ingredientes
- Histórico vinculado a ingredientes e produtos
- Sessões vinculadas aos usuários

## 🔐 Autenticação e Autorização

### Sistema de Autenticação

- **Passport.js Local Strategy**: Autenticação via email/senha
- **Sessões Seguras**: Usando PostgreSQL para armazenamento
- **Hash de Senhas**: BCrypt com salt rounds configurável
- **Validação Forte**: Senhas com critérios rigorosos

### Níveis de Autorização

- **User (Padrão)**: Acesso completo às funcionalidades principais
- **Admin**: Acesso adicional ao gerenciamento de usuários

### Segurança

- **CORS Configurado**: Para requisições cross-origin
- **Trust Proxy**: Suporte a reverse proxies
- **Auditoria**: Log de operações importantes
- **Rate Limiting**: Proteção contra ataques

## 🚀 Deploy em Produção

### Preparação

1. Configure as variáveis de ambiente de produção
2. Configure o banco PostgreSQL
3. Execute o build: `npm run build`

### Plataformas Suportadas

#### Render

```yaml
# render.yaml incluído no projeto
services:
  - type: web
    name: candycost
    env: node
    buildCommand: npm run build
    startCommand: npm run start:prod
```

#### Heroku

```bash
# Adicionar buildpacks
heroku buildpacks:add heroku/nodejs

# Definir variáveis
heroku config:set DATABASE_URL="sua_url_postgresql"
heroku config:set SESSION_SECRET="sua_chave_secreta"
heroku config:set NODE_ENV="production"
```

#### VPS/Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Pós-Deploy

1. Execute as migrações: `npm run db:migrate:deploy`
2. Crie o primeiro admin: `npx tsx server/scripts/initAdmin.ts`
3. Configure backup automático do banco de dados

## 🧪 Testes e Qualidade

### Funcionalidades de Teste

- **Validação de Entrada**: Todos os endpoints validam dados com Zod
- **Tratamento de Erros**: Sistema robusto de tratamento de exceções
- **Logs Estruturados**: Sistema de auditoria e debugging
- **Conversão de Unidades**: Testes abrangentes de conversões

### Monitoramento

- **Logs de Auditoria**: arquivo `logs/audit.log`
- **Logs de Conversão**: arquivo `logs/unit-conversions.log`
- **Performance**: Middleware de logging de tempo de resposta

## 🤝 Contribuição

### Como Contribuir

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -am 'Adiciona nova feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

### Padrões de Código

- **TypeScript Strict**: Tipagem rigorosa em todo o projeto
- **ESLint + Prettier**: Formatação consistente
- **Conventional Commits**: Mensagens de commit padronizadas
- **Componentização**: Componentes reutilizáveis e modulares

### Áreas para Contribuição

- **Testes Automatizados**: Implementação de testes unitários e E2E
- **Novas Funcionalidades**: Relatórios avançados, integração com APIs
- **Performance**: Otimizações de consultas e rendering
- **UI/UX**: Melhorias na interface e experiência do usuário
- **Documentação**: Expansão da documentação técnica

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo `LICENSE` para mais detalhes.

---

## 💡 Sobre o Projeto

CandyCost foi desenvolvido especificamente para atender às necessidades reais de confeiteiros e pequenos empreendedores do ramo de doces. A aplicação nasceu da necessidade de ter um controle preciso dos custos de produção, considerando a complexidade das receitas de confeitaria e a importância da margem de lucro no sucesso do negócio.

### 🎯 Problemas Resolvidos

- **Cálculo Manual Complexo**: Automatização completa dos cálculos de custo
- **Controle de Estoque**: Visibilidade dos ingredientes e seus custos
- **Precificação Inconsistente**: Base sólida para definição de preços
- **Falta de Histórico**: Rastreabilidade completa das mudanças
- **Análise Limitada**: Dashboard com insights acionáveis

### 🚀 Benefícios

- **Economia de Tempo**: Redução drástica do tempo gasto com cálculos
- **Precisão**: Eliminação de erros de cálculo manual
- **Rentabilidade**: Visibilidade clara da margem de lucro real
- **Profissionalização**: Gestão empresarial estruturada
- **Escalabilidade**: Suporte ao crescimento do negócio

---

## 👨‍💻 Autor

**Emerson Bezerra**  
Desenvolvedor Full Stack especializado em soluções web modernas

- 📧 **Email**: [emersonbbezerra@gmail.com](mailto:emersonbbezerra@gmail.com)
- 💼 **LinkedIn**: [linkedin.com/in/emersonbbezerra](https://www.linkedin.com/in/emersonbbezerra/)
- 🐙 **GitHub**: [github.com/emersonbbezerra](https://github.com/emersonbbezerra)

---

**Desenvolvido com ❤️ para a comunidade de confeiteiros**

Para dúvidas, sugestões ou suporte, entre em contato através das issues do GitHub ou pelos canais de contato acima.

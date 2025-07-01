# CandyCost - Sistema de Gestão de Custos para Confeitaria

## Visão Geral
Sistema completo de gestão de custos para confeitaria desenvolvido com React + Express.js. Permite gerenciar ingredientes, produtos, receitas e histórico de preços com cálculo automático de custos de produção.

## Arquitetura do Projeto
- **Frontend**: React com TypeScript, Wouter para roteamento, TanStack Query para gerenciamento de estado
- **Backend**: Express.js com armazenamento em memória (MemStorage)
- **UI**: Shadcn/ui + Tailwind CSS
- **Validação**: Zod + Drizzle para schemas

## Funcionalidades Implementadas
- ✅ Dashboard com estatísticas e gráficos de evolução de custos
- ✅ Gerenciamento completo de ingredientes (CRUD, categorias, preços)
- ✅ Gerenciamento de produtos com receitas e cálculo de custos
- ✅ Histórico automático de alterações de preços
- ✅ Produtos que também funcionam como ingredientes
- ✅ Cálculo automático de custo quando ingredientes são alterados
- ✅ Interface responsiva com navegação por sidebar

## Características Especiais
- **Produtos como Ingredientes**: Produtos podem ser marcados para uso em outras receitas (ex: brigadeiro usado como recheio)
- **Cálculo Cascata**: Alterações de preço em ingredientes propagam automaticamente para todos os produtos
- **Evolução por Produto**: Dashboard permite escolher produto específico para ver evolução de custos

## Alterações Recentes
- **29/06/2025**: FUNCIONALIDADES AVANÇADAS COMPLETAS:
  - **Sistema de Alertas Inteligentes**: Detecta aumentos de preço e custos elevados automaticamente
  - **Exportação de Relatórios**: CSV/JSON com dados completos para Excel e análise externa
  - **Backup e Restauração**: Sistema completo de backup dos dados com download automático
  - **Alertas de Custo**: Notificações quando ingredientes ficam caros demais por categoria
  - **Relatórios Personalizados**: Múltiplos formatos de exportação (ingredientes, produtos, histórico)
- **29/06/2025**: MELHORIAS COMPLETAS DE INTERFACE E USABILIDADE:
  - **Confirmações de Exclusão**: Diálogos elegantes para confirmar exclusões com avisos detalhados
  - **Filtros Avançados**: Busca por texto e filtros por categoria em ingredientes e produtos
  - **Gráficos Melhorados**: Dashboard e histórico com gráficos mais informativos e interativos
  - **Calculadora em Tempo Real**: Formulário de ingredientes mostra custo por unidade automaticamente
  - **Layout Aprimorado**: Seções organizadas com cores e ícones visuais nos formulários
  - **Estados Vazios Inteligentes**: Mensagens diferentes para listas vazias vs. filtros sem resultado
- **29/06/2025**: Criada página dedicada "Histórico de Custos" com registro automático de alterações:
  - Novo menu "Histórico de Custos" na sidebar (ícone TrendingUp)
  - Sistema automático registra mudanças nos custos quando ingredientes são alterados
  - Gráfico de evolução dos custos por mês para produtos/receitas
  - Lista detalhada com motivos das alterações automáticas
- **29/06/2025**: Implementado método calculateProductCostAtPrice para cálculo histórico de custos
- **29/06/2025**: Reestruturação completa da página de Histórico - separada em duas seções distintas:
  - Histórico de Preços de Ingredientes (azul, ícone Package)
  - Histórico de Custos de Receitas (verde, ícone ShoppingCart)
- **29/06/2025**: Implementado seletor de produto específico na evolução de custos do dashboard
- **29/06/2025**: Corrigidos erros de validação no sidebar (Link aninhado) e query duplicada no histórico
- **29/06/2025**: Adicionada linha de preço sugerido no gráfico quando produto específico é selecionado
- **29/06/2025**: Corrigido formulário de edição de produtos - dados agora carregam corretamente
- **29/06/2025**: Removido campo "Produto" desnecessário da seção receitas no formulário de produtos
- **29/06/2025**: Implementados selects padronizados para categorias de produtos/ingredientes e unidades
- **29/06/2025**: Melhorado layout da seção receitas com tamanhos proporcionais e ícone menor na lixeira
- **29/06/2025**: Criado arquivo de constantes compartilhadas para categorias e unidades
- **29/06/2025**: Corrigida funcionalidade de produtos como ingredientes - agora aparecem na lista e são salvos corretamente
- **29/06/2025**: Adicionada visualização das receitas na página de produtos, mostrando ingredientes e produtos-ingredientes
- **29/06/2025**: Removido separador visual desnecessário e identificador "(Produto)" - produtos-ingredientes agora aparecem naturalmente na lista
- **29/06/2025**: Alterado menu de navegação - removida opção "Produtos", mantendo apenas "Receitas" como nomenclatura principal
- **29/06/2025**: Criada seção de Relatórios específica com análises diferenciadas do Dashboard
- **01/07/2025**: REORGANIZAÇÃO COMPLETA DO MENU - SEPARAÇÃO DE RESPONSABILIDADES:
  - **Nova seção "Sistema"**: Funcionalidades administrativas (backup, restauração, configurações)
  - **Relatórios focados**: Apenas análises de dados e exportações
  - **Menu preparado para expansão**: Estrutura pronta para usuários, configurações avançadas
- **01/07/2025**: FUNCIONALIDADES DE SISTEMA AVANÇADAS IMPLEMENTADAS:
  - **Restauração de Backup Completa**: Sistema funcional com validação e confirmação de segurança
  - **Página de Configurações**: Interface completa para personalizar margens, alertas e preferências
  - **Sistema de Cache Inteligente**: Hooks otimizados para melhorar performance das consultas
  - **Limpeza Automática**: Dados existentes removidos antes da restauração para evitar conflitos
  - **Validação Robusta**: Verificação de integridade dos arquivos de backup antes da restauração
- **01/07/2025**: SISTEMA COMPLETO DE AUTENTICAÇÃO E SEGURANÇA IMPLEMENTADO:
  - **PostgreSQL**: Banco de dados configurado para gestão robusta de usuários e sessões
  - **Autenticação Passport.js**: Sistema seguro com bcrypt para hash de senhas
  - **Middleware de Proteção**: Todas as rotas protegidas com verificação de autenticação
  - **Controle de Acesso por Papel**: Administradores têm acesso completo, usuários comuns limitados
  - **Interface de Login**: Tela elegante com tabs para login/cadastro e validação em tempo real
  - **Usuário Admin**: Criado automaticamente (admin@confeitaria.com / admin123!)
  - **Sidebar Personalizada**: Mostra informações do usuário, papel e botão de logout
  - **Sessões Persistentes**: Configuração segura com armazenamento no PostgreSQL
- **01/07/2025**: REBRANDING COMPLETO PARA CANDYCOST:
  - **Nome da Aplicação**: Alterado de ConfeiCalc para CandyCost em todos os componentes
  - **Interface Atualizada**: Título, sidebar, tela de login e mensagens com novo nome
  - **Sistema de Backup**: Validação atualizada para aceitar apenas backups do CandyCost
  - **Branding Consistente**: Nome aplicado em todos os textos e validações do sistema

## Melhorias de Interface
- **Selects Padronizados**: Categorias de produtos, ingredientes e unidades agora usam listas predefinidas
- **Layout Responsivo**: Seção de receitas com grid de 12 colunas para melhor distribuição
- **Validação Aprimorada**: Formulários com validação consistente e carregamento correto de dados

## Preferências do Usuário
- **Idioma**: Português (sempre responder em português)
- **Foco**: Gestão prática de custos de confeitaria
- **Interface**: Simples e intuitiva para uso por confeiteiros
- **Layout**: Campos maiores para seleção, ícones menores, selects ao invés de inputs livres

## Estado Atual
Sistema funcionando corretamente com formulários de edição operacionais. Implementadas melhorias de usabilidade solicitadas incluindo selects padronizados, layout melhorado da seção receitas e correção do carregamento de dados para edição.
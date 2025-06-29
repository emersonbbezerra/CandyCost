# Sistema de Gestão de Custos para Confeitaria (ConfeiCalc)

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
- **29/06/2025**: Implementado seletor de produto específico na evolução de custos do dashboard
- **29/06/2025**: Corrigidos erros de validação no sidebar (Link aninhado) e query duplicada no histórico
- **29/06/2025**: Adicionada linha de preço sugerido no gráfico quando produto específico é selecionado

## Preferências do Usuário
- **Idioma**: Português (sempre responder em português)
- **Foco**: Gestão prática de custos de confeitaria
- **Interface**: Simples e intuitiva para uso por confeiteiros

## Estado Atual
Sistema funcionando corretamente com dados de exemplo. Dashboard agora permite visualizar evolução de custos tanto geral quanto por produto específico, atendendo à solicitação do usuário para melhor identificação da evolução por produto.
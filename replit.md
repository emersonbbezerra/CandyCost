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
- **29/06/2025**: Reestruturação completa da página de Histórico - separada em duas seções distintas:
  - Histórico de Preços de Ingredientes (azul, ícone Package)
  - Histórico de Custos de Receitas (verde, ícone ShoppingCart)
- **29/06/2025**: Corrigida atualização automática do histórico - dados aparecem instantaneamente após alterações
- **29/06/2025**: Adicionada invalidação automática da query de histórico em todas as mutações
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
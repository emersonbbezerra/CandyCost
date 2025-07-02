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
- **01/07/2025**: ESTRATÉGIAS AVANÇADAS DE SEGURANÇA PARA PRODUÇÃO IMPLEMENTADAS:
  - **Variáveis de Ambiente**: Suporte a INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD para configuração segura
  - **CLI Administrativo**: Ferramenta completa de linha de comando para gerenciamento de usuários
  - **Interface de Gerenciamento**: Página administrativa para promoção e listagem de usuários
  - **APIs Protegidas**: Rotas administrativas com dupla autenticação (isAuthenticated + isAdmin)
  - **Múltiplas Estratégias**: Variáveis de ambiente, CLI e interface web para diferentes cenários
  - **Documentação Completa**: Guia detalhado de segurança para implantação em produção
  - **Validações Robustas**: Verificação de senhas complexas e prevenção de duplicação de admins
- **01/07/2025**: MELHORIAS NO SISTEMA DE CADASTRO E AUTENTICAÇÃO:
  - **Problema Solucionado**: Erro 404 após cadastro de usuário corrigido com redirecionamento automático
  - **Validação de Senha Forte**: Implementada tanto no frontend quanto backend
  - **Critérios Obrigatórios**: Mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial
  - **Interface Melhorada**: Dicas visuais de critérios de senha no formulário de cadastro
  - **Redirecionamento Automático**: Usuário é direcionado ao dashboard após cadastro bem-sucedido
- **02/07/2025**: COMUNICAÇÃO COMPLETAMENTE AMIGÁVEL IMPLEMENTADA:
  - **Eliminação Total de Códigos**: Removidos todos os códigos HTTP e técnicos das mensagens do usuário
  - **Sistema Toast Refinado**: Mensagens aparecem apenas com texto direto e educado para o usuário final
  - **QueryClient Corrigido**: Extração automática de mensagens amigáveis do servidor sem códigos de status
  - **Tratamento de Erro Simplificado**: Frontend e backend trabalham juntos para mostrar apenas mensagens claras
  - **Experiência do Usuário Melhorada**: Todas as interações do sistema agora usam linguagem natural e compreensível
- **02/07/2025**: SISTEMA AVANÇADO DE SEGURANÇA E CONTROLE DE ACESSO IMPLEMENTADO:
  - **Separação de Configurações**: Criadas rotas distintas para configurações administrativas e pessoais
  - **Interface Adaptativa**: Página de configurações se adapta automaticamente ao papel do usuário (admin/user)
  - **Controles Visuais**: Campos administrativos desabilitados para usuários comuns com feedback visual claro
  - **Rota Segura Personal**: /api/settings/personal permite apenas alteração de enablePriceAlerts e enableCostAlerts
  - **Validação Robusta**: Backend valida permissões e filtra configurações baseado no papel do usuário
  - **Alertas Informativos**: Mensagens explicativas sobre restrições de acesso para usuários não-administradores
- **02/07/2025**: REVERSÃO DO LOGO OFICIAL POR QUESTÕES DE CONTRASTE:
  - **Problema Identificado**: Logo PNG contém partes brancas que não contrastam bem com fundo da aplicação
  - **Sidebar Restaurada**: Voltou ao ícone Calculator original com fundo colorido para melhor visibilidade
  - **Login Restaurado**: Voltou ao ícone ChefHat original em rosa para manter identidade visual
  - **Decisão do Usuário**: Preferência por manter os ícones originais ao invés de logo com baixo contraste
  - **Identidade Visual**: Mantida consistência com nome "CandyCost" e cores adequadas ao contexto
- **02/07/2025**: REORGANIZAÇÃO COMPLETA DO MENU SISTEMA COM SUBMENU EXPANDÍVEL:
  - **Submenu Inteligente**: Menu "Sistema" agora possui submenu expandível com navegação direta
  - **Opções de Submenu**: "Backup & Restauração" (ícone Database), "Configurações" (ícone Cog) e "Gerenciar Usuários" (admin-only)
  - **Página Simplificada**: Removidos cards desnecessários da página Sistema - agora mostra apenas conteúdo de Backup & Restauração
  - **Navegação Otimizada**: Acesso direto às funcionalidades via sidebar sem necessidade de cards intermediários
  - **Interface Melhorada**: Ícones de expansão (ChevronDown/ChevronRight) indicam estado do submenu
  - **Rotas Funcionais**: /system/backup, /settings e /user-management acessíveis diretamente via submenu
- **02/07/2025**: SISTEMA TOTALMENTE RESPONSIVO E MOBILE-FIRST IMPLEMENTADO:
  - **Menu Hamburger**: Botão fixo no canto superior esquerdo para dispositivos móveis
  - **Sidebar Deslizante**: Transição suave com overlay escuro para fechamento automático
  - **Scroll Inteligente**: Barra de rolagem na sidebar para visualizar todas as opções em telas pequenas
  - **Layout Adaptativo**: Margem automática ajustada (lg:ml-64) e padding mobile (pt-16 lg:pt-0)
  - **Responsividade Completa**: Breakpoint em 1024px (lg) para alternar entre desktop e mobile
  - **Usabilidade Aprimorada**: Fechamento automático do menu móvel ao navegar entre páginas
  - **Hierarquia Preservada**: Submenu Sistema mantém funcionalidade completa em dispositivos móveis
- **02/07/2025**: OTIMIZAÇÃO COMPLETA PARA DISPOSITIVOS MÓVEIS - SCROLLBAR HORIZONTAL ELIMINADA:
  - **Interface de Ingredientes**: Tabela substituída por cards responsivos em smartphones (lg:hidden/lg:block)
  - **Padding Responsivo**: Todas as páginas com padding adaptativo (p-4 lg:p-8) para evitar overflow
  - **Cards Mobile**: Interface com cards organizados verticalmente com informações completas
  - **Tabela Desktop**: Mantida tabela completa em telas grandes com overflow-x-auto quando necessário
  - **Layout Otimizado**: Eliminação total de scrollbar horizontal em todas as páginas
  - **Experiência Consistente**: Design uniforme entre desktop e mobile mantendo todas as funcionalidades
  - **Reposicionamento de Botões**: Botões "Novo Ingrediente" e "Nova Receita" movidos abaixo dos textos descritivos
  - **Paginação Mobile-Friendly**: Botões de paginação otimizados para dispositivos móveis com símbolos (‹ ›) e layout centralizado
- **02/07/2025**: FINALIZAÇÃO COMPLETA DA RESPONSIVIDADE MOBILE:
  - **Relatórios Mobile**: Cards de ingredientes críticos com layout flexível (flex-col sm:flex-row)
  - **Histórico de Custos**: Gráficos empilháveis com altura reduzida em mobile (h-48 lg:h-64)
  - **Gerenciamento de Usuários**: Botões de ação organizados verticalmente em mobile com texto otimizado
  - **Interface Unificada**: Sistema totalmente responsivo sem barras de rolagem horizontal
  - **Layout Adaptativo**: Breakpoints consistentes (sm/lg) em todas as páginas para experiência fluida
- **02/07/2025**: SISTEMA COMPLETO DE PAGINAÇÃO IMPLEMENTADO:
  - **Padrão Unificado**: 12 itens por página em todas as listas (ingredientes, produtos, usuários)
  - **Paginação Inteligente**: Filtros resetam automaticamente para página 1 ao serem alterados
  - **Interface Responsiva**: Desktop mostra botões completos, mobile usa símbolos (‹ ›) compactos
  - **Controles Funcionais**: Botões anterior/próximo desabilitados apropriadamente nos extremos
  - **Informação Contextual**: Display "Página X de Y" centralizado em dispositivos móveis
  - **Integração com Filtros**: Paginação funciona corretamente com busca e filtros por categoria
  - **Gerenciamento de Usuários**: Página administrativa totalmente responsiva com layout adaptativo
  - **Botão Exportar Repositionado**: Movido para cabeçalho da página de relatórios para melhor usabilidade
- **02/07/2025**: OTIMIZAÇÃO FINAL DA RESPONSIVIDADE - ELIMINAÇÃO TOTAL DE OVERFLOW HORIZONTAL:
  - **Padding Ultra-Compacto**: Container principal com p-2 md:p-4 lg:p-8 para máximo aproveitamento do espaço
  - **Cards de Estatísticas Miniaturizados**: Ícones 6x6 em mobile (8x8 em desktop), textos xs/sm responsivos
  - **Gaps Mínimos**: gap-2 md:gap-4 lg:gap-6 para evitar expansão além da viewport
  - **Cards de Usuários Compactos**: Ícones de perfil 8x8 em mobile, espaçamentos reduzidos (space-x-2)
  - **Overflow Protection**: overflow-x-hidden aplicado ao container principal como medida definitiva
  - **Layout Flex Otimizado**: min-w-0 em divs para permitir truncamento correto de textos longos
  - **Responsividade Perfeita**: Interface totalmente funcional sem barras de rolagem horizontal em qualquer dispositivo

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
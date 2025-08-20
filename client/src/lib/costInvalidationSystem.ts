/**
 * Sistema centralizado de invalidação de cache para propagação de mudanças de custos
 * Este sistema garante que qualquer alteração que afete custos seja refletida em todos os locais da aplicação
 */

export const COST_RELATED_QUERIES = {
  // Queries do Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_RECENT_UPDATES: '/api/dashboard/recent-updates',
  DASHBOARD_COST_EVOLUTION: '/api/dashboard/cost-evolution',
  DASHBOARD: '/api/dashboard',

  // Queries de Produtos
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  PRODUCT_COSTS: (id: string) => `/api/products/${id}/cost`,

  // Queries de Ingredientes
  INGREDIENTS: '/api/ingredients',
  INGREDIENT_BY_ID: (id: string) => `/api/ingredients/${id}`,

  // Queries de Custos Fixos
  FIXED_COSTS: '/api/fixed-costs',
  FIXED_COSTS_MONTHLY_TOTAL: '/api/fixed-costs/monthly-total',
  FIXED_COSTS_BY_CATEGORY: '/api/fixed-costs/by-category',
  FIXED_COSTS_COST_PER_HOUR: '/api/fixed-costs/cost-per-hour',
  FIXED_COSTS_ACTIVE: '/api/fixed-costs/active',

  // Queries de Configuração de Trabalho
  WORK_CONFIG: '/api/work-config/work-configuration',
  WORK_CONFIG_FIXED_COSTS: '/api/fixed-costs/work-configuration',

  // Queries de Histórico
  PRICE_HISTORY: '/api/price-history',
  COSTS_HISTORY: '/api/costs-history',

  // Queries de Receitas
  RECIPES: '/api/recipes',
  RECIPE_BY_PRODUCT: (productId: string) => `/api/recipes/product/${productId}`,

  // Queries de Settings/Configurações
  SETTINGS: '/api/settings',
} as const;

/**
 * Define conjuntos de queries que devem ser invalidadas para diferentes tipos de mudanças
 */
export const INVALIDATION_GROUPS = {
  // Quando ingredientes mudam (preço, quantidade, etc.)
  INGREDIENT_CHANGES: [
    COST_RELATED_QUERIES.INGREDIENTS,
    COST_RELATED_QUERIES.PRODUCTS, // Produtos são afetados por mudanças nos ingredientes
    COST_RELATED_QUERIES.PRICE_HISTORY,
    COST_RELATED_QUERIES.COSTS_HISTORY,
    COST_RELATED_QUERIES.DASHBOARD_STATS,
    COST_RELATED_QUERIES.DASHBOARD_RECENT_UPDATES,
    COST_RELATED_QUERIES.DASHBOARD_COST_EVOLUTION,
    COST_RELATED_QUERIES.RECIPES,
  ],

  // Quando produtos mudam (yield, tempo de preparo, margem, etc.)
  PRODUCT_CHANGES: [
    COST_RELATED_QUERIES.PRODUCTS,
    COST_RELATED_QUERIES.PRICE_HISTORY,
    COST_RELATED_QUERIES.COSTS_HISTORY,
    COST_RELATED_QUERIES.DASHBOARD_STATS,
    COST_RELATED_QUERIES.DASHBOARD_RECENT_UPDATES,
    COST_RELATED_QUERIES.DASHBOARD_COST_EVOLUTION,
    COST_RELATED_QUERIES.RECIPES,
  ],

  // Quando custos fixos mudam
  FIXED_COST_CHANGES: [
    COST_RELATED_QUERIES.FIXED_COSTS,
    COST_RELATED_QUERIES.FIXED_COSTS_MONTHLY_TOTAL,
    COST_RELATED_QUERIES.FIXED_COSTS_BY_CATEGORY,
    COST_RELATED_QUERIES.FIXED_COSTS_COST_PER_HOUR,
    COST_RELATED_QUERIES.FIXED_COSTS_ACTIVE,
    COST_RELATED_QUERIES.PRODUCTS, // Produtos são afetados por custos fixos
    COST_RELATED_QUERIES.PRICE_HISTORY,
    COST_RELATED_QUERIES.COSTS_HISTORY,
    COST_RELATED_QUERIES.DASHBOARD_STATS,
    COST_RELATED_QUERIES.DASHBOARD_RECENT_UPDATES,
    COST_RELATED_QUERIES.DASHBOARD_COST_EVOLUTION,
  ],

  // Quando configuração de trabalho muda
  WORK_CONFIG_CHANGES: [
    COST_RELATED_QUERIES.WORK_CONFIG,
    COST_RELATED_QUERIES.WORK_CONFIG_FIXED_COSTS,
    COST_RELATED_QUERIES.FIXED_COSTS_COST_PER_HOUR,
    COST_RELATED_QUERIES.FIXED_COSTS_MONTHLY_TOTAL,
    COST_RELATED_QUERIES.PRODUCTS, // Produtos são afetados pela configuração de trabalho
    COST_RELATED_QUERIES.PRICE_HISTORY,
    COST_RELATED_QUERIES.COSTS_HISTORY,
    COST_RELATED_QUERIES.DASHBOARD_STATS,
    COST_RELATED_QUERIES.DASHBOARD_RECENT_UPDATES,
    COST_RELATED_QUERIES.DASHBOARD_COST_EVOLUTION,
  ],

  // Quando receitas mudam (ingredientes adicionados/removidos/alterados)
  RECIPE_CHANGES: [
    COST_RELATED_QUERIES.RECIPES,
    COST_RELATED_QUERIES.PRODUCTS, // Produtos são afetados por mudanças nas receitas
    COST_RELATED_QUERIES.PRICE_HISTORY,
    COST_RELATED_QUERIES.COSTS_HISTORY,
    COST_RELATED_QUERIES.DASHBOARD_STATS,
    COST_RELATED_QUERIES.DASHBOARD_RECENT_UPDATES,
    COST_RELATED_QUERIES.DASHBOARD_COST_EVOLUTION,
  ],

  // Invalidação completa (para casos críticos)
  FULL_COST_RECALCULATION: [
    COST_RELATED_QUERIES.PRODUCTS,
    COST_RELATED_QUERIES.INGREDIENTS,
    COST_RELATED_QUERIES.FIXED_COSTS,
    COST_RELATED_QUERIES.FIXED_COSTS_MONTHLY_TOTAL,
    COST_RELATED_QUERIES.FIXED_COSTS_BY_CATEGORY,
    COST_RELATED_QUERIES.FIXED_COSTS_COST_PER_HOUR,
    COST_RELATED_QUERIES.FIXED_COSTS_ACTIVE,
    COST_RELATED_QUERIES.WORK_CONFIG,
    COST_RELATED_QUERIES.WORK_CONFIG_FIXED_COSTS,
    COST_RELATED_QUERIES.PRICE_HISTORY,
    COST_RELATED_QUERIES.COSTS_HISTORY,
    COST_RELATED_QUERIES.DASHBOARD_STATS,
    COST_RELATED_QUERIES.DASHBOARD_RECENT_UPDATES,
    COST_RELATED_QUERIES.DASHBOARD_COST_EVOLUTION,
    COST_RELATED_QUERIES.DASHBOARD,
    COST_RELATED_QUERIES.RECIPES,
    COST_RELATED_QUERIES.SETTINGS,
  ],
} as const;

/**
 * Utilitário para invalidar grupos de queries
 */
export function createInvalidateQueries(queryClient: any) {
  return {
    /**
     * Invalida queries quando ingredientes são alterados
     */
    onIngredientChange: (ingredientId?: string) => {
      console.log(
        '🔄 Invalidating queries due to ingredient change:',
        ingredientId
      );

      INVALIDATION_GROUPS.INGREDIENT_CHANGES.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      if (ingredientId) {
        queryClient.invalidateQueries({
          queryKey: [COST_RELATED_QUERIES.INGREDIENT_BY_ID(ingredientId)],
        });
      }

      // Invalidar também queries de custo de produtos específicos
      queryClient.invalidateQueries({
        predicate: (query: any) => {
          return (
            query.queryKey?.[0]?.includes?.('/cost') ||
            query.queryKey?.[0]?.includes?.('/products/')
          );
        },
      });
    },

    /**
     * Invalida queries quando produtos são alterados
     */
    onProductChange: (productId?: string) => {
      console.log('🔄 Invalidating queries due to product change:', productId);

      INVALIDATION_GROUPS.PRODUCT_CHANGES.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      if (productId) {
        queryClient.invalidateQueries({
          queryKey: [COST_RELATED_QUERIES.PRODUCT_BY_ID(productId)],
        });
        queryClient.invalidateQueries({
          queryKey: [COST_RELATED_QUERIES.PRODUCT_COSTS(productId)],
        });
        queryClient.invalidateQueries({
          queryKey: [COST_RELATED_QUERIES.RECIPE_BY_PRODUCT(productId)],
        });
      }
    },

    /**
     * Invalida queries quando custos fixos são alterados
     */
    onFixedCostChange: () => {
      console.log('🔄 Invalidating queries due to fixed cost change');

      INVALIDATION_GROUPS.FIXED_COST_CHANGES.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Invalidar queries de dashboard com diferentes parâmetros
      queryClient.invalidateQueries({
        predicate: (query: any) => {
          return query.queryKey?.[0]?.includes?.('dashboard');
        },
      });
    },

    /**
     * Invalida queries quando configuração de trabalho é alterada
     */
    onWorkConfigChange: () => {
      console.log('🔄 Invalidating queries due to work configuration change');

      INVALIDATION_GROUPS.WORK_CONFIG_CHANGES.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Invalidação especial para custo por hora que pode ter diferentes endpoints
      queryClient.invalidateQueries({
        predicate: (query: any) => {
          return (
            query.queryKey?.[0]?.includes?.('cost-per-hour') ||
            query.queryKey?.[0]?.includes?.('work-config')
          );
        },
      });
    },

    /**
     * Invalida queries quando receitas são alteradas
     */
    onRecipeChange: (productId?: string) => {
      console.log('🔄 Invalidating queries due to recipe change:', productId);

      INVALIDATION_GROUPS.RECIPE_CHANGES.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      if (productId) {
        queryClient.invalidateQueries({
          queryKey: [COST_RELATED_QUERIES.RECIPE_BY_PRODUCT(productId)],
        });
      }
    },

    /**
     * Invalidação completa - usar apenas em casos extremos
     */
    fullRecalculation: () => {
      console.log('🔄 Performing full cost recalculation invalidation');

      INVALIDATION_GROUPS.FULL_COST_RECALCULATION.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Invalidar todas as queries relacionadas a custos
      queryClient.invalidateQueries({
        predicate: (query: any) => {
          const key = query.queryKey?.[0];
          return (
            key?.includes?.('cost') ||
            key?.includes?.('product') ||
            key?.includes?.('ingredient') ||
            key?.includes?.('dashboard') ||
            key?.includes?.('history') ||
            key?.includes?.('fixed')
          );
        },
      });
    },

    /**
     * Invalidação completa de todas as queries relacionadas - para casos como restore de backup
     */
    invalidateAll: () => {
      console.log('🔄 Invalidating all cost-related queries');

      INVALIDATION_GROUPS.FULL_COST_RECALCULATION.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Invalidar todas as queries conhecidas
      Object.values(COST_RELATED_QUERIES).forEach((queryKey) => {
        if (typeof queryKey === 'string') {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      });
    },
  };
}

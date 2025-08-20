/**
 * Hook customizado para gerenciar invalidação de custos
 * Centraliza toda a lógica de invalidação para mudanças que afetam custos
 */

import { createInvalidateQueries } from '@/lib/costInvalidationSystem';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useCostInvalidation() {
  const queryClient = useQueryClient();
  const invalidateQueries = createInvalidateQueries(queryClient);

  return {
    /**
     * Invalida quando ingredientes mudam
     */
    invalidateOnIngredientChange: useCallback(
      (ingredientId?: string) => {
        invalidateQueries.onIngredientChange(ingredientId);
      },
      [invalidateQueries]
    ),

    /**
     * Invalida quando produtos mudam
     */
    invalidateOnProductChange: useCallback(
      (productId?: string) => {
        invalidateQueries.onProductChange(productId);
      },
      [invalidateQueries]
    ),

    /**
     * Invalida quando custos fixos mudam
     */
    invalidateOnFixedCostChange: useCallback(() => {
      invalidateQueries.onFixedCostChange();
    }, [invalidateQueries]),

    /**
     * Invalida quando configuração de trabalho muda
     */
    invalidateOnWorkConfigChange: useCallback(() => {
      invalidateQueries.onWorkConfigChange();
    }, [invalidateQueries]),

    /**
     * Invalida quando receitas mudam
     */
    invalidateOnRecipeChange: useCallback(
      (productId?: string) => {
        invalidateQueries.onRecipeChange(productId);
      },
      [invalidateQueries]
    ),

    /**
     * Invalidação completa para recálculo de custos
     */
    invalidateFullRecalculation: useCallback(() => {
      invalidateQueries.fullRecalculation();
    }, [invalidateQueries]),

    /**
     * Acesso direto ao queryClient para casos especiais
     */
    queryClient,
  };
}

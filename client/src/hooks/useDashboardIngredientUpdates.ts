/**
 * Hook específico para updates de ingredientes no dashboard
 * Mantém independência total das outras invalidações do sistema
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface IngredientUpdate {
  id: string;
  type: 'ingredient';
  name: string;
  itemId: string | null;
  oldPrice: string;
  newPrice: string;
  unit?: string;
  changeType: string;
  createdAt: string;
  changeReason?: string;
  contextData?: {
    originalOldPrice?: number;
    originalOldQuantity?: number;
    originalOldUnit?: string;
    originalNewPrice?: number;
    originalNewQuantity?: number;
    originalNewUnit?: string;
  };
}

export function useDashboardIngredientUpdates() {
  const queryClient = useQueryClient();

  // Query específica só para ingredientes - nunca invalidada externamente
  const query = useQuery<IngredientUpdate[]>({
    queryKey: ['/api/dashboard/ingredient-updates'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/ingredient-updates');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredient updates');
      }
      const data = await response.json();
      return data.ingredientUpdates || [];
    },
    staleTime: 30 * 1000, // 30 segundos - dados ficam "fresh" por mais tempo
    gcTime: 5 * 60 * 1000, // 5 minutos no cache
  });

  // Método para invalidar APENAS esta query específica
  const invalidateIngredientUpdates = useCallback(() => {
    console.log('🥄 Invalidating ONLY ingredient updates');
    queryClient.invalidateQueries({
      queryKey: ['/api/dashboard/ingredient-updates'],
      exact: true, // Só invalida esta query exata
    });
  }, [queryClient]);

  return {
    ingredientUpdates: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    invalidateIngredientUpdates,
  };
}

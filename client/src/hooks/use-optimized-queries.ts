import { useQuery, useQueries } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

// Cache otimizado para dados frequentemente acessados
export function useOptimizedDashboardData() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["/api/dashboard/stats"],
        queryFn: getQueryFn({ on401: "throw" }),
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["/api/ingredients"],
        queryFn: getQueryFn({ on401: "throw" }),
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["/api/products"],
        queryFn: getQueryFn({ on401: "throw" }),
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["/api/price-history"],
        queryFn: getQueryFn({ on401: "throw" }),
        staleTime: 10 * 60 * 1000, // 10 minutos
        gcTime: 20 * 60 * 1000, // 20 minutos
        refetchOnWindowFocus: false,
      }
    ]
  });

  const [statsQuery, ingredientsQuery, productsQuery, historyQuery] = queries;

  return {
    stats: {
      data: statsQuery.data,
      isLoading: statsQuery.isLoading,
      error: statsQuery.error,
    },
    ingredients: {
      data: ingredientsQuery.data || [],
      isLoading: ingredientsQuery.isLoading,
      error: ingredientsQuery.error,
    },
    products: {
      data: productsQuery.data || [],
      isLoading: productsQuery.isLoading,
      error: productsQuery.error,
    },
    priceHistory: {
      data: historyQuery.data || [],
      isLoading: historyQuery.isLoading,
      error: historyQuery.error,
    },
    isLoading: queries.some(q => q.isLoading),
    hasErrors: queries.some(q => q.error),
  };
}

// Hook otimizado para dados de produtos com receitas
export function useOptimizedProductsWithCosts() {
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Buscar custos apenas dos produtos que existem
  const costQueries = useQueries({
    queries: (products || []).map((product: any) => ({
      queryKey: ["/api/products", product.id, "cost"],
      queryFn: async () => {
        const response = await fetch(`/api/products/${product.id}/cost`);
        if (!response.ok) throw new Error("Erro ao buscar custo");
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 15 * 60 * 1000, // 15 minutos
      enabled: !!product.id,
    }))
  });

  const productsWithCosts = (products || []).map((product: any, index: number) => ({
    ...product,
    cost: costQueries[index]?.data,
    costLoading: costQueries[index]?.isLoading,
  }));

  return {
    data: productsWithCosts,
    isLoading: productsLoading || costQueries.some(q => q.isLoading),
    error: costQueries.find(q => q.error)?.error,
  };
}

// Hook para buscar dados de relatórios com cache inteligente
export function useOptimizedReports() {
  return useQuery({
    queryKey: ["/api/reports"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 10 * 60 * 1000, // 10 minutos - relatórios mudam menos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Hook para ingredientes com pré-filtragem local
export function useOptimizedIngredients(searchTerm?: string, categoryFilter?: string) {
  const { data: allIngredients, isLoading, error } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Filtrar localmente para evitar requests desnecessários
  const filteredIngredients = (allIngredients || []).filter((ingredient: any) => {
    const matchesSearch = !searchTerm || 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || 
      ingredient.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return {
    data: filteredIngredients,
    allData: allIngredients || [],
    isLoading,
    error,
  };
}
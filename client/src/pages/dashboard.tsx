import { CostAlerts } from "@/components/cost-alerts";
import { CostEvolutionChart } from "@/components/cost-evolution-chart";
import { RecentUpdatesCard } from "@/components/recent-updates";
import { StatsCards } from "@/components/stats-cards";
import type { Product } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string>("general");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Novos estados para filtros de ingredientes e produtos
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState<string>("all");
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("all"); const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/dashboard/stats", selectedCategory],
    queryFn: () => fetch(`/api/dashboard/stats?type=category&category=${selectedCategory}`).then(res => res.json()),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Buscar ingredientes por categoria
  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: () => fetch("/api/ingredients").then(res => res.json()),
  });

  // Calcular ingredientes por categoria
  const ingredientsByCategory = ingredients.reduce((acc: { [key: string]: number }, ingredient: any) => {
    const category = ingredient.category || 'Outros';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Calcular produtos por categoria
  const productsByCategory = products.reduce((acc: { [key: string]: number }, product: Product) => {
    const category = product.category || 'Outros';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Extrair categorias disponíveis para cada tipo
  const availableIngredientCategories = Object.keys(ingredientsByCategory).sort();
  const availableProductCategories = Object.keys(productsByCategory).sort();

  // Invalidate recent updates when dashboard is focused or visibility changes
  useEffect(() => {
    const handleFocus = () => {
      // Only invalidate if there might be changes from other pages
      const lastNavigation = sessionStorage.getItem('lastPageNavigation');
      const wasOnProductsOrIngredients = lastNavigation === 'products' || lastNavigation === 'ingredients';

      if (wasOnProductsOrIngredients) {
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-updates"] });
        sessionStorage.removeItem('lastPageNavigation');
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When the tab becomes visible, check for updates
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-updates"] });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  if (statsLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 w-full min-w-0 overflow-x-hidden">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
          Dashboard
        </h2>
        <p className="text-gray-600 mt-2">Visão geral dos custos de produção</p>
      </div>

      {/* Alertas de Custos */}
      <CostAlerts />

      {/* Stats Cards */}
      <StatsCards
        totalIngredients={stats?.totalIngredients || 0}
        totalProducts={stats?.totalProducts || 0}
        avgProfitMargin={stats?.avgProfitMargin || "0"}
        selectedCategory={selectedCategory}
        availableCategories={stats?.availableCategories || []}
        onCategoryChange={(category: string) => {
          setSelectedCategory(category);
          refetchStats();
        }}
        ingredientsByCategory={ingredientsByCategory}
        availableIngredientCategories={availableIngredientCategories}
        selectedIngredientCategory={selectedIngredientCategory}
        onIngredientCategoryChange={(category: string) => {
          setSelectedIngredientCategory(category);
        }}
        productsByCategory={productsByCategory}
        availableProductCategories={availableProductCategories}
        selectedProductCategory={selectedProductCategory}
        onProductCategoryChange={(category: string) => {
          setSelectedProductCategory(category);
        }}
      />

      {/* Cost Evolution Chart - Full Width at Top */}
      <div className="mb-8">
        <CostEvolutionChart products={products} />
      </div>

      {/* Recent Updates - Full Width Below */}
      <div className="mb-8">
        <RecentUpdatesCard />
      </div>
    </div>
  );
}
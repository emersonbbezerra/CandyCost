import { CostAlerts } from "@/components/cost-alerts";
import { CostEvolutionChart } from "@/components/cost-evolution-chart";
import { RecentUpdatesCard } from "@/components/recent-updates";
import { StatsCards } from "@/components/stats-cards";
import type { Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalIngredients: number;
    totalProducts: number;
    avgCost: string;
    todayChanges: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

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
    <div className="p-4 lg:p-8">
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
        avgCost={stats?.avgCost || "0"}
        todayChanges={stats?.todayChanges || 0}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <CostEvolutionChart products={products} />
        <RecentUpdatesCard />
      </div>
    </div>
  );
}

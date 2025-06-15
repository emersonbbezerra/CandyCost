import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sprout, Cookie, Calculator, TrendingUp } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface DashboardStats {
  totalIngredients: number;
  totalProducts: number;
  avgCost: string;
  todayChanges: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: priceHistory = [] } = useQuery({
    queryKey: ["/api/price-history"],
  });

  // Mock chart data for demonstration
  const chartData = [
    { month: "Jan", cost: 11.2 },
    { month: "Fev", cost: 11.8 },
    { month: "Mar", cost: 12.1 },
    { month: "Abr", cost: 11.9 },
    { month: "Mai", cost: 12.4 },
    { month: "Jun", cost: parseFloat(stats?.avgCost || "12.45") },
  ];

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
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Visão geral dos custos de produção</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ingredientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalIngredients || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Sprout className="text-green-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">Ativo</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos Cadastrados</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cookie className="text-blue-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600 font-medium">Ativo</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo Médio/Produto</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(stats?.avgCost || "0"))}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calculator className="text-purple-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">média calculada</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alterações Hoje</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.todayChanges || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-orange-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">preços atualizados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Price Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Custo Médio']} />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="hsl(207, 90%, 54%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(207, 90%, 54%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Atualizações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceHistory.slice(0, 5).map((history) => (
                <div key={history.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="text-blue-600 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      Preço atualizado de {formatCurrency(parseFloat(history.oldPrice))} para {formatCurrency(parseFloat(history.newPrice))}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {history.changeReason || "Atualização manual"}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatRelativeTime(new Date(history.createdAt))}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    parseFloat(history.newPrice) > parseFloat(history.oldPrice)
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {parseFloat(history.newPrice) > parseFloat(history.oldPrice) ? "+" : ""}
                    {(((parseFloat(history.newPrice) - parseFloat(history.oldPrice)) / parseFloat(history.oldPrice)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              
              {priceHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma atualização de preço registrada ainda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

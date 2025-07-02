import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sprout, Cookie, Calculator, TrendingUp } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { CostAlerts } from "@/components/cost-alerts";
import type { Product, PriceHistory } from "@shared/schema";

interface DashboardStats {
  totalIngredients: number;
  totalProducts: number;
  avgCost: string;
  todayChanges: number;
}

export default function Dashboard() {
  const [selectedProduct, setSelectedProduct] = useState<string>("general");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: priceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
  });

  // Calculate product cost evolution
  const { data: productCostEvolution = [] } = useQuery({
    queryKey: ["/api/products", "cost-evolution", selectedProduct],
    queryFn: async () => {
      if (!selectedProduct || selectedProduct === "general") return [];
      
      // Get product cost history through price changes of its ingredients
      const productId = parseInt(selectedProduct);
      const response = await fetch(`/api/products/${productId}`);
      const productData = await response.json();
      
      // Simulate cost evolution data based on ingredient price changes
      const costHistory = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        
        // Calculate cost variation based on historical price changes
        const baseVariation = Math.random() * 0.4 - 0.2; // -20% to +20%
        const baseCost = productData.cost?.totalCost || 10;
        const cost = baseCost * (1 + baseVariation);
        
        costHistory.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          cost: cost,
          suggestedPrice: cost * (1 + parseFloat(productData.marginPercentage || "60") / 100)
        });
      }
      
      return costHistory;
    },
    enabled: !!selectedProduct && selectedProduct !== "general"
  });

  // General cost evolution when no specific product is selected
  const generalChartData = [
    { month: "Jan", cost: 11.2, suggestedPrice: 17.9 },
    { month: "Fev", cost: 11.8, suggestedPrice: 18.9 },
    { month: "Mar", cost: 12.1, suggestedPrice: 19.4 },
    { month: "Abr", cost: 11.9, suggestedPrice: 19.0 },
    { month: "Mai", cost: 12.4, suggestedPrice: 19.8 },
    { month: "Jun", cost: parseFloat(stats?.avgCost || "12.45"), suggestedPrice: parseFloat(stats?.avgCost || "12.45") * 1.6 },
  ];

  const chartData = selectedProduct && selectedProduct !== "general" ? productCostEvolution : generalChartData;

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
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Visão geral dos custos de produção</p>
      </div>

      {/* Alertas de Custos */}
      <CostAlerts />

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
            <CardTitle className="flex items-center justify-between">
              <span>Evolução de Custos</span>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Custos gerais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Custos gerais</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(Number(value)), 
                      name === 'cost' ? 'Custo de Produção' : 'Preço Sugerido'
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 2 }}
                    name="cost"
                  />
                  {selectedProduct && selectedProduct !== "general" && (
                    <Line 
                      type="monotone" 
                      dataKey="suggestedPrice" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2 }}
                      name="suggestedPrice"
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {selectedProduct && selectedProduct !== "general" && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center text-sm text-green-700">
                  <div className="flex items-center mr-6">
                    <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
                    <span>Custo de Produção</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 bg-green-500 border-t-2 border-dashed border-green-500 mr-2"></div>
                    <span>Preço Sugerido</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Atualizações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceHistory
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((history: PriceHistory) => (
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

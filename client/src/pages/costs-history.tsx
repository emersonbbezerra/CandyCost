import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { formatDate } from "@/lib/utils";
import type { PriceHistory, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CostsHistory() {
  const formatCurrency = useFormatCurrency();
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Carregar todos os dados de histórico inicialmente
  const { data: allPriceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
  });

  // Filtrar apenas histórico de custos de produtos (receitas)
  const productHistory = allPriceHistory.filter(item => item.productId && !item.ingredientId);

  // Filtrar produtos baseado na seleção
  const filteredProductHistory = productHistory.filter(item =>
    selectedProduct === "all" || item.productId?.toString() === selectedProduct
  );

  // Group product history by month for chart
  const productChartData = filteredProductHistory.reduce((acc: Record<string, any>, item) => {
    const month = new Date(item.createdAt).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    });

    if (!acc[month]) {
      acc[month] = {
        month,
        changes: 0,
        avgIncrease: 0,
        totalIncrease: 0,
      };
    }

    const oldPrice = typeof item.oldPrice === 'string' ? parseFloat(item.oldPrice) : item.oldPrice;
    const newPrice = typeof item.newPrice === 'string' ? parseFloat(item.newPrice) : item.newPrice;
    const increase = ((newPrice - oldPrice) / oldPrice) * 100;
    acc[month].changes += 1;
    acc[month].totalIncrease += increase;
    acc[month].avgIncrease = acc[month].totalIncrease / acc[month].changes;

    return acc;
  }, {} as Record<string, any>);

  const productChartArray = Object.values(productChartData).slice(-6);

  const recentProductChanges = filteredProductHistory
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // Buscar nome do produto
  const getProductName = (id: number | null) => {
    if (!id) return "Produto desconhecido";
    const product = products.find(p => String(p.id) === String(id));
    return product?.name || "Produto não encontrado";
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
          Histórico de Custos de Receitas
        </h2>
        <p className="text-gray-600 mt-2">Acompanhe como as alterações de preços de ingredientes afetam os custos dos seus produtos</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Produto/Receita
            </label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gráficos aprimorados de evolução dos custos */}
          {productChartArray.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Variação de Custos por Mês
                </h3>
                <div className="h-48 lg:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productChartArray}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                      />
                      <YAxis
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        label={{ value: 'Variação (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${value.toFixed(1)}%`, "Variação Média"]}
                        labelFormatter={(label) => `Mês: ${label}`}
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="avgIncrease"
                        fill="#10b981"
                        name="Variação Média %"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
                  Número de Alterações por Mês
                </h3>
                <div className="h-48 lg:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productChartArray}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                      />
                      <YAxis
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        label={{ value: 'Alterações', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${value}`, "Alterações"]}
                        labelFormatter={(label) => `Mês: ${label}`}
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="changes"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 mb-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum histórico de custos disponível</p>
                <p className="text-sm text-gray-400">Altere o preço de algum ingrediente para começar a ver os dados</p>
              </div>
            </div>
          )}

          {/* Lista detalhada de alterações de custos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Alterações Recentes nos Custos</h3>
            <div className="space-y-3">
              {recentProductChanges.map((change: PriceHistory) => (
                <div key={change.id} className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="text-green-600 w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">
                      {change.itemName || "Produto desconhecido"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Custo alterado de {formatCurrency(typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice)} para {formatCurrency(typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Motivo: {change.description ? change.description : "Alteração automática"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(new Date(change.createdAt))}
                    </p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${(typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice) > (typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice)
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                      }`}>
                      {(typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice) > (typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice) ? "+" : ""}
                      {(((typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice) - (typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice)) / (typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {(typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice) > (typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice) ? "Aumento" : "Redução"}
                    </p>
                  </div>
                </div>
              ))}

              {recentProductChanges.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhuma alteração de custo registrada</p>
                  <p className="text-sm">
                    Os custos dos produtos são alterados automaticamente quando você modifica o preço dos ingredientes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
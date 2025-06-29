import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PriceHistory, Product } from "@shared/schema";

export default function CostsHistory() {
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
    
    const increase = ((parseFloat(item.newPrice) - parseFloat(item.oldPrice)) / parseFloat(item.oldPrice)) * 100;
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
    const product = products.find(p => p.id === id);
    return product?.name || "Produto não encontrado";
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Histórico de Custos de Receitas</h2>
        <p className="text-gray-600 mt-2">Acompanhe como as alterações de preços de ingredientes afetam os custos dos seus produtos</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Produto/Receita
            </label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart de evolução dos custos */}
          {productChartArray.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Evolução dos Custos por Mês</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartArray}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toFixed(1)}%`, "Variação Média"]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Bar dataKey="avgIncrease" fill="#10b981" name="Variação Média %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 mb-8">
              <p>Nenhum histórico de custos disponível ainda</p>
            </div>
          )}

          {/* Lista detalhada de alterações de custos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Alterações Recentes nos Custos</h3>
            <div className="space-y-3">
              {recentProductChanges.map((change: PriceHistory) => (
                <div key={change.id} className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="text-green-600 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      {getProductName(change.productId)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Custo alterado de {formatCurrency(parseFloat(change.oldPrice))} para {formatCurrency(parseFloat(change.newPrice))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Motivo: {change.changeReason || "Alteração automática"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(new Date(change.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      parseFloat(change.newPrice) > parseFloat(change.oldPrice)
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {parseFloat(change.newPrice) > parseFloat(change.oldPrice) ? "+" : ""}
                      {(((parseFloat(change.newPrice) - parseFloat(change.oldPrice)) / parseFloat(change.oldPrice)) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {parseFloat(change.newPrice) > parseFloat(change.oldPrice) ? "Aumento" : "Redução"}
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
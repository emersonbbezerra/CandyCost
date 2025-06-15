import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, History as HistoryIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PriceHistory, Ingredient, Product } from "@shared/schema";

export default function History() {
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: priceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history", { 
      ingredientId: selectedIngredient || undefined,
      productId: selectedProduct || undefined 
    }],
    queryKey: ["/api/price-history"],
  });

  // Group price history by month for chart
  const chartData = priceHistory.reduce((acc, item) => {
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

  const chartDataArray = Object.values(chartData).slice(-6);

  const recentChanges = priceHistory.slice(0, 10);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Histórico de Preços</h2>
        <p className="text-gray-600 mt-2">Acompanhe a evolução dos preços de ingredientes e produtos</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Ingrediente
              </label>
              <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os ingredientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os ingredientes</SelectItem>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                      {ingredient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Produto
              </label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os produtos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Price Changes Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Alterações de Preço por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'changes' ? value : `${Number(value).toFixed(1)}%`,
                      name === 'changes' ? 'Alterações' : 'Variação Média'
                    ]}
                  />
                  <Bar dataKey="changes" fill="hsl(207, 90%, 54%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average Price Variation */}
        <Card>
          <CardHeader>
            <CardTitle>Variação Média de Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Variação Média']} />
                  <Line 
                    type="monotone" 
                    dataKey="avgIncrease" 
                    stroke="hsl(125, 60%, 45%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(125, 60%, 45%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HistoryIcon className="w-5 h-5" />
            <span>Alterações Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentChanges.map((change) => {
              const percentChange = ((parseFloat(change.newPrice) - parseFloat(change.oldPrice)) / parseFloat(change.oldPrice)) * 100;
              const isIncrease = percentChange > 0;
              
              const ingredient = change.ingredientId ? 
                ingredients.find(i => i.id === change.ingredientId) : null;
              const product = change.productId ? 
                products.find(p => p.id === change.productId) : null;

              return (
                <div key={change.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isIncrease ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {isIncrease ? (
                      <TrendingUp className="text-red-600 w-5 h-5" />
                    ) : (
                      <TrendingDown className="text-green-600 w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      <span className="font-medium">
                        {ingredient?.name || product?.name || 'Item'}
                      </span>{" "}
                      teve preço {isIncrease ? 'aumentado' : 'reduzido'} de{" "}
                      <span className="font-medium">{formatCurrency(parseFloat(change.oldPrice))}</span>{" "}
                      para{" "}
                      <span className="font-medium">{formatCurrency(parseFloat(change.newPrice))}</span>
                    </p>
                    {change.changeReason && (
                      <p className="text-sm text-gray-500 mt-1">
                        Motivo: {change.changeReason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(new Date(change.createdAt))}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isIncrease 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {isIncrease ? '+' : ''}{percentChange.toFixed(1)}%
                  </span>
                </div>
              );
            })}

            {recentChanges.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Nenhuma alteração de preço registrada ainda.</p>
                <p className="text-sm mt-2">
                  Quando você atualizar preços de ingredientes, eles aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

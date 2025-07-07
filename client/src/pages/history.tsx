import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Ingredient, PriceHistory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon, Package } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function History() {
  const [selectedIngredient, setSelectedIngredient] = useState<string>("all");

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Carregar todos os dados de histórico inicialmente
  const { data: allPriceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
  });

  // Filtrar histórico de ingredientes
  const ingredientHistory = allPriceHistory.filter(item => item.ingredientId && !item.productId);

  // Filtrar ingredientes baseado na seleção
  const filteredIngredientHistory = ingredientHistory.filter(item =>
    selectedIngredient === "all" || item.ingredientId?.toString() === selectedIngredient
  );

  // Agrupar histórico de ingredientes por mês para o gráfico
  const ingredientChartData = filteredIngredientHistory.reduce((acc: Record<string, any>, item) => {
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

  const ingredientChartArray = Object.values(ingredientChartData).slice(-6);

  const recentIngredientChanges = filteredIngredientHistory
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Buscar nome do ingrediente
  const getIngredientName = (id: number | null) => {
    if (!id) return "Ingrediente desconhecido";
    const ingredient = ingredients.find(i => i.id === id);
    return ingredient?.name || "Ingrediente não encontrado";
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <HistoryIcon className="w-8 h-8 mr-3 text-blue-600" />
          Histórico de Preços de Ingredientes
        </h2>
        <p className="text-gray-600 mt-2">Acompanhe a evolução dos preços dos seus ingredientes ao longo do tempo</p>
      </div>

      {/* Seção de Ingredientes */}
      <div>
        <div className="flex items-center gap-2 mt-4">

        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Ingrediente
              </label>
              <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Todos os ingredientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ingredientes</SelectItem>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                      {ingredient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chart de ingredientes */}
            {ingredientChartArray.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ingredientChartArray}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => [`${value.toFixed(1)}%`, "Variação Média"]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Bar dataKey="avgIncrease" fill="#3b82f6" name="Variação Média %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Nenhum histórico de ingredientes disponível</p>
              </div>
            )}

            {/* Lista de alterações recentes de ingredientes */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">Alterações Recentes</h4>
              <div className="space-y-3">
                {recentIngredientChanges.map((change: PriceHistory) => (
                  <div key={change.id} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="text-blue-600 w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">
                        {getIngredientName(change.ingredientId)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Preço alterado de {formatCurrency(parseFloat(change.oldPrice))} para {formatCurrency(parseFloat(change.newPrice))}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(new Date(change.createdAt))}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${parseFloat(change.newPrice) > parseFloat(change.oldPrice)
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                      }`}>
                      {parseFloat(change.newPrice) > parseFloat(change.oldPrice) ? "+" : ""}
                      {(((parseFloat(change.newPrice) - parseFloat(change.oldPrice)) / parseFloat(change.oldPrice)) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}

                {recentIngredientChanges.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma alteração de preço de ingrediente registrada ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
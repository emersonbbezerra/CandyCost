import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { formatDate } from "@/lib/utils";
import type { PriceHistory, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CostsHistory() {
  const formatCurrency = useFormatCurrency();
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  // Estados para paginação das alterações recentes
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estados para filtro por período
  const [periodFilter, setPeriodFilter] = useState<string>("30"); // Padrão: últimos 30 dias

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Carregar todos os dados de histórico inicialmente
  const { data: allPriceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
  });

  // Filtrar apenas histórico de custos de produtos (receitas)
  const productHistory = allPriceHistory.filter(item => item.productId && !item.ingredientId);

  // Calcular data limite baseada no período selecionado
  const getDateLimit = (period: string) => {
    const now = new Date();
    const days = parseInt(period);

    if (period === "all") return null; // Sem limite de data

    const limitDate = new Date();
    limitDate.setDate(now.getDate() - days);
    return limitDate;
  };

  // Filtrar produtos baseado na seleção e período
  const filteredProductHistory = productHistory.filter(item => {
    // Filtro por produto
    const matchesProduct = selectedProduct === "all" || item.productId?.toString() === selectedProduct;

    // Filtro por período
    const dateLimit = getDateLimit(periodFilter);
    const matchesPeriod = !dateLimit || new Date(item.createdAt) >= dateLimit;

    return matchesProduct && matchesPeriod;
  });

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

  // Ordenar alterações recentes por data (mais recente primeiro)
  const sortedProductChanges = filteredProductHistory
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aplicar paginação
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductChanges = sortedProductChanges.slice(startIndex, endIndex);

  // Calcular total de páginas
  const totalPages = Math.ceil(sortedProductChanges.length / itemsPerPage);

  // Resetar página quando filtro mudar
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedProduct, periodFilter]);

  // Buscar nome do produto
  const getProductName = (id: number | null) => {
    if (!id) return "Produto desconhecido";
    const product = products.find(p => String(p.id) === String(id));
    return product?.name || "Produto não encontrado";
  };

  const getProductUnit = (id: string | number | null) => {
    if (!id) return "";
    const product = products.find(p => String(p.id) === String(id));
    return product?.yieldUnit ? ` / ${product.yieldUnit}` : "";
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Produto/Receita
              </label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Período
              </label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="180">Últimos 6 meses</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {paginatedProductChanges.map((change: PriceHistory) => (
                <div key={change.id} className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="text-green-600 w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">
                      {change.itemName || "Produto desconhecido"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Custo por unidade alterado de {formatCurrency(typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice)} para {formatCurrency(typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice)}
                      {getProductUnit(change.productId ?? null)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Motivo: {change.description ? change.description.replace(/Recalculo/g, 'Recálculo') : "Alteração automática"}
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
                      {(typeof change.newPrice === 'string' ? parseFloat(change.newPrice) : change.newPrice) > (typeof change.oldPrice === 'string' ? parseFloat(change.oldPrice) : change.oldPrice) ? "Aumento por unidade" : "Redução por unidade"}
                    </p>
                  </div>
                </div>
              ))}

              {paginatedProductChanges.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhuma alteração de custo registrada</p>
                  <p className="text-sm">
                    Os custos dos produtos são alterados automaticamente quando você modifica o preço dos ingredientes.
                  </p>
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600 text-center mb-4">
                  Página {currentPage} de {totalPages} ({sortedProductChanges.length} alterações)
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">‹</span>
                  </Button>

                  <div className="hidden sm:flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="sm:hidden flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{currentPage}/{totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <span className="sm:hidden">›</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
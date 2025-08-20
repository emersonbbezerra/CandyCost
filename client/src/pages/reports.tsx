import { ExportReports } from "@/components/export-reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Ingredient, Product, ProductCost } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calculator,
  DollarSign,
  FileText,
  Filter,
  Package,
  Search,
  SortAsc,
  SortDesc,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ReportsData {
  profitabilityAnalysis: {
    product: Product;
    cost: ProductCost;
    profitMargin: number;
  }[];
  criticalIngredients: {
    ingredient: Ingredient;
    usageCount: number;
    totalImpact: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
    avgCost: number;
  }[];
  complexRecipes: {
    product: Product;
    hasProductIngredients: boolean;
    ingredientCount: number;
  }[];
}

export default function Reports() {
  const queryClient = useQueryClient();

  // Estados para filtros da análise de lucratividade
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "profitMargin" | "cost">("profitMargin");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [profitabilityFilter, setProfitabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estados para filtros dos ingredientes críticos
  const [criticalSearchTerm, setCriticalSearchTerm] = useState("");
  const [criticalCategoryFilter, setCriticalCategoryFilter] = useState("all");
  const [criticalSortBy, setCriticalSortBy] = useState<"name" | "totalImpact" | "usageCount">("totalImpact");
  const [criticalSortOrder, setCriticalSortOrder] = useState<"asc" | "desc">("desc");
  const [criticalCurrentPage, setCriticalCurrentPage] = useState(1);
  const criticalItemsPerPage = 5;

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: reportsData, isLoading } = useQuery<ReportsData>({
    queryKey: ["/api/reports"],
    enabled: products.length > 0,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Effect para invalidar queries quando a página recebe foco ou se torna visível
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  // Obter categorias únicas dos produtos
  const categories = useMemo(() => {
    const categorySet = new Set(products.map(p => p.category));
    const uniqueCategories = Array.from(categorySet);
    return uniqueCategories.sort();
  }, [products]);

  // Filtrar e ordenar dados de lucratividade
  const filteredProfitabilityData = useMemo(() => {
    if (!reportsData?.profitabilityAnalysis) return [];

    let filtered = reportsData.profitabilityAnalysis.filter(item => {
      // Filtro por nome
      const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por categoria
      const matchesCategory = categoryFilter === "all" || item.product.category === categoryFilter;

      // Filtro por lucratividade
      let matchesProfitability = true;
      if (profitabilityFilter === "high") {
        matchesProfitability = item.profitMargin > 50;
      } else if (profitabilityFilter === "medium") {
        matchesProfitability = item.profitMargin >= 30 && item.profitMargin <= 50;
      } else if (profitabilityFilter === "low") {
        matchesProfitability = item.profitMargin < 30;
      }

      return matchesSearch && matchesCategory && matchesProfitability;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.product.name.localeCompare(b.product.name);
          break;
        case "profitMargin":
          comparison = a.profitMargin - b.profitMargin;
          break;
        case "cost":
          comparison = a.cost.totalCost - b.cost.totalCost;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [reportsData?.profitabilityAnalysis, searchTerm, categoryFilter, sortBy, sortOrder, profitabilityFilter]);

  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProfitabilityData.slice(startIndex, endIndex);
  }, [filteredProfitabilityData, currentPage, itemsPerPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredProfitabilityData.length / itemsPerPage);

  // Obter categorias únicas dos ingredientes
  const ingredientCategories = useMemo(() => {
    const categorySet = new Set(ingredients.map(i => i.category));
    const uniqueCategories = Array.from(categorySet);
    return uniqueCategories.sort();
  }, [ingredients]);

  // Filtrar e ordenar dados de ingredientes críticos
  const filteredCriticalIngredients = useMemo(() => {
    if (!reportsData?.criticalIngredients) return [];

    let filtered = reportsData.criticalIngredients.filter(item => {
      // Filtro por nome
      const matchesSearch = item.ingredient.name.toLowerCase().includes(criticalSearchTerm.toLowerCase());

      // Filtro por categoria
      const matchesCategory = criticalCategoryFilter === "all" || item.ingredient.category === criticalCategoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (criticalSortBy) {
        case "name":
          comparison = a.ingredient.name.localeCompare(b.ingredient.name);
          break;
        case "totalImpact":
          comparison = a.totalImpact - b.totalImpact;
          break;
        case "usageCount":
          comparison = a.usageCount - b.usageCount;
          break;
      }

      return criticalSortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [reportsData?.criticalIngredients, criticalSearchTerm, criticalCategoryFilter, criticalSortBy, criticalSortOrder]);

  // Calcular dados paginados para ingredientes críticos
  const criticalPaginatedData = useMemo(() => {
    const startIndex = (criticalCurrentPage - 1) * criticalItemsPerPage;
    const endIndex = startIndex + criticalItemsPerPage;
    return filteredCriticalIngredients.slice(startIndex, endIndex);
  }, [filteredCriticalIngredients, criticalCurrentPage, criticalItemsPerPage]);

  // Calcular total de páginas para ingredientes críticos
  const criticalTotalPages = Math.ceil(filteredCriticalIngredients.length / criticalItemsPerPage);

  // Reset página quando filtros mudam
  const resetFilters = () => {
    setCurrentPage(1);
  };



  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <FileText className="w-8 h-8 mr-3 text-blue-600" />
          Relatórios
        </h2>
        <p className="text-gray-600 mt-2">Análises detalhadas e insights do seu negócio</p>
        <div className="mt-4">
          <ExportReports />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise de Lucratividade */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Análise de Lucratividade
            </CardTitle>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mt-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={profitabilityFilter} onValueChange={(value) => {
                setProfitabilityFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Lucratividade" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta (acima de 50%)</SelectItem>
                  <SelectItem value="medium">Média (30-50%)</SelectItem>
                  <SelectItem value="low">Baixa (abaixo de 30%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="profitMargin-desc">Maior Lucratividade</SelectItem>
                  <SelectItem value="profitMargin-asc">Menor Lucratividade</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="cost-asc">Menor Custo</SelectItem>
                  <SelectItem value="cost-desc">Maior Custo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedData.map(({ product, cost, profitMargin }) => (
                <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="text-xs text-gray-600">
                      <span>Custo por unidade: <b>{product.yield > 0 ? formatCurrency(cost.costPerYieldUnit ?? (cost.totalCost / product.yield)) : '-'}</b> / {product.yieldUnit}</span> <br />
                      <span>Preço de venda por unidade: <b>{product.yield > 0 ? formatCurrency(cost.salePricePerUnit ?? (product.salePrice / product.yield)) : '-'}</b> / {product.yieldUnit}</span> <br />
                      <span>Margem real: <b>{product.yield > 0 ? formatCurrency((cost.salePricePerUnit ?? (product.salePrice / product.yield)) - (cost.costPerYieldUnit ?? (cost.totalCost / product.yield))) : '-'}</b></span> <br />
                      <span>Rendimento: <b>{product.yield} {product.yieldUnit}</b></span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start space-x-2 flex-shrink-0">
                    <Badge
                      variant={profitMargin > 50 ? "default" : profitMargin > 30 ? "secondary" : "destructive"}
                      className={
                        profitMargin > 50
                          ? "bg-green-100 text-green-800 border-green-200"
                          : profitMargin > 30
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {profitMargin.toFixed(1)}%
                    </Badge>
                    {profitMargin > 50 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : profitMargin > 30 ? (
                      <TrendingUp className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
              {filteredProfitabilityData.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum produto encontrado com os filtros aplicados.</p>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600 text-center mb-4">
                  Página {currentPage} de {totalPages} ({filteredProfitabilityData.length} produtos)
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
          </CardContent>
        </Card>

        {/* Ingredientes Críticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Ingredientes Críticos
            </CardTitle>

            {/* Filtros para Ingredientes Críticos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-4">
              <Input
                placeholder="Buscar ingrediente..."
                value={criticalSearchTerm}
                onChange={(e) => {
                  setCriticalSearchTerm(e.target.value);
                  setCriticalCurrentPage(1);
                }}
                className="w-full"
              />

              <Select value={criticalCategoryFilter} onValueChange={(value) => {
                setCriticalCategoryFilter(value);
                setCriticalCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {ingredientCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={`${criticalSortBy}-${criticalSortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [typeof criticalSortBy, typeof criticalSortOrder];
                setCriticalSortBy(newSortBy);
                setCriticalSortOrder(newSortOrder);
                setCriticalCurrentPage(1);
              }}>
                <SelectTrigger>
                  {criticalSortOrder === "asc" ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="totalImpact-desc">Maior Impacto</SelectItem>
                  <SelectItem value="totalImpact-asc">Menor Impacto</SelectItem>
                  <SelectItem value="usageCount-desc">Mais Usado</SelectItem>
                  <SelectItem value="usageCount-asc">Menos Usado</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalPaginatedData.map(({ ingredient, usageCount, totalImpact }) => (
                <div key={ingredient.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{ingredient.name}</p>
                    <p className="text-sm text-gray-600">
                      {ingredient.category} • Usado em {usageCount} receita{usageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right sm:text-right flex-shrink-0">
                    <p className="font-medium">{formatCurrency(totalImpact)}</p>
                    <p className="text-sm text-gray-600">Impacto total</p>
                  </div>
                </div>
              ))}
              {filteredCriticalIngredients.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum ingrediente encontrado com os filtros aplicados.</p>
              )}
            </div>

            {/* Paginação para Ingredientes Críticos */}
            {criticalTotalPages > 1 && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600 text-center mb-4">
                  Página {criticalCurrentPage} de {criticalTotalPages} ({filteredCriticalIngredients.length} ingredientes)
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCriticalCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={criticalCurrentPage === 1}
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">‹</span>
                  </Button>

                  <div className="hidden sm:flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, criticalTotalPages) }, (_, i) => {
                      let pageNumber;
                      if (criticalTotalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (criticalCurrentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (criticalCurrentPage >= criticalTotalPages - 2) {
                        pageNumber = criticalTotalPages - 4 + i;
                      } else {
                        pageNumber = criticalCurrentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={criticalCurrentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCriticalCurrentPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="sm:hidden flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{criticalCurrentPage}/{criticalTotalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCriticalCurrentPage(prev => Math.min(prev + 1, criticalTotalPages))}
                    disabled={criticalCurrentPage === criticalTotalPages}
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <span className="sm:hidden">›</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsData?.categoryDistribution.map(({ category, count, avgCost }) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{category}</p>
                    <p className="text-sm text-gray-600">{count} produto{count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(avgCost)}</p>
                    <p className="text-sm text-gray-600">Custo médio</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Receitas Complexas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-purple-600" />
              Receitas Complexas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsData?.complexRecipes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma receita complexa encontrada</p>
              ) : (
                reportsData?.complexRecipes.map(({ product, hasProductIngredients, ingredientCount }) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        {ingredientCount} ingrediente{ingredientCount !== 1 ? 's' : ''}
                        {hasProductIngredients && " • Usa produtos"}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {hasProductIngredients && (
                        <Badge variant="outline">Multi-nível</Badge>
                      )}
                      {ingredientCount > 5 && (
                        <Badge variant="secondary">Muitos ingredientes</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {reportsData?.profitabilityAnalysis[0]?.profitMargin.toFixed(1) || '0'}%
              </p>
              <p className="text-sm text-gray-600">Maior lucratividade</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {reportsData?.criticalIngredients.length || 0}
              </p>
              <p className="text-sm text-gray-600">Ingredientes críticos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {reportsData?.categoryDistribution.length || 0}
              </p>
              <p className="text-sm text-gray-600">Categorias ativas</p>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
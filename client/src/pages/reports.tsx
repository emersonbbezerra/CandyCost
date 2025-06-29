import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  FileText, 
  Download,
  DollarSign,
  Package,
  Calculator,
  Search,
  SortAsc,
  SortDesc,
  Filter
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Ingredient, Product, ProductCost } from "@shared/schema";

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
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "profitMargin" | "cost">("profitMargin");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [profitabilityFilter, setProfitabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: reportsData, isLoading } = useQuery<ReportsData>({
    queryKey: ["/api/reports"],
    enabled: products.length > 0
  });

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

  // Reset página quando filtros mudam
  const resetFilters = () => {
    setCurrentPage(1);
  };

  const handleExportReport = () => {
    // Implementar exportação futura
    alert("Funcionalidade de exportação será implementada em breve!");
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
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Relatórios</h2>
            <p className="text-gray-600 mt-2">Análises detalhadas e insights do seu negócio</p>
          </div>
          <Button onClick={handleExportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatórios
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
                <SelectContent>
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
                <SelectContent>
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
                <SelectContent>
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
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(cost.totalCost)} → {formatCurrency(cost.suggestedPrice)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
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
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProfitabilityData.length)} de {filteredProfitabilityData.length} produtos
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsData?.criticalIngredients.slice(0, 5).map(({ ingredient, usageCount, totalImpact }) => (
                <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{ingredient.name}</p>
                    <p className="text-sm text-gray-600">Usado em {usageCount} receita{usageCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(totalImpact)}</p>
                    <p className="text-sm text-gray-600">Impacto total</p>
                  </div>
                </div>
              ))}
            </div>
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
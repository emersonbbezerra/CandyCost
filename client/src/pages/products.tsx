import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductForm } from "@/components/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { useCostInvalidation } from "@/hooks/useCostInvalidation";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@shared/constants";
import type { Product, ProductCost } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, ChefHat, Edit, Filter, Layers, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type ProductWithCost = Product & {
  salePrice: number;
  yield: number;
  yieldUnit: string;
  cost?: ProductCost;
};

export default function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('hasRecentUpdates');

    return () => {
      sessionStorage.setItem('lastPageNavigation', 'products');
    };
  }, []);
  const [editingProduct, setEditingProduct] = useState<ProductWithCost | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<"name" | "totalCost" | "marginPercentage">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithCost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const costInvalidation = useCostInvalidation();

  const { data: products = [], isLoading } = useQuery<ProductWithCost[]>({
    queryKey: ["/api/products"],
  });

  const { data: productDetails } = useQuery({
    queryKey: ["/api/products", "details"],
    queryFn: async () => {
      const detailedProducts = await Promise.all(
        products.map(async (product) => {
          const response = await apiRequest("GET", `/api/products/${product.id}`);
          return response.json();
        })
      );
      return detailedProducts;
    },
    enabled: products.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      costInvalidation.invalidateOnProductChange();
      successToast("Sucesso", "Produto excluído com sucesso!");
    },
    onError: (err) => {
      console.error("Erro na deleção do produto:", err);
      errorToast("Erro", "Erro ao excluir produto. Tente novamente.");
    },
  });

  const handleEdit = async (product: ProductWithCost) => {
    try {
      const response = await apiRequest("GET", `/api/products/${product.id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const productWithRecipes = await response.json();

      const sanitizedProduct = {
        ...productWithRecipes,
        marginPercentage: productWithRecipes.marginPercentage || "60",
        preparationTimeMinutes: productWithRecipes.preparationTimeMinutes || 60,
        recipes: productWithRecipes.recipes || []
      };

      setEditingProduct(sanitizedProduct);
      setIsFormOpen(true);
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      errorToast("Erro", "Erro ao carregar dados do produto. Tente novamente.");
    }
  };

  const handleDelete = (product: ProductWithCost) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = filteredProducts.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "totalCost":
        aValue = a.cost?.totalCost ?? 0;
        bValue = b.cost?.totalCost ?? 0;
        break;
      case "marginPercentage":
        aValue = a.cost?.margin ?? 0;
        bValue = b.cost?.margin ?? 0;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 w-full min-w-0 overflow-x-hidden">
      <div className="mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <ChefHat className="w-8 h-8 mr-3 text-blue-600" />
            Receitas
          </h2>
          <p className="text-gray-600 mt-2">Gerencie receitas e produtos com cálculo de custos</p>
          <div className="mt-4">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 lg:p-6">
          {/* Filtros reorganizados em grid responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {/* Campo de busca */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar receitas..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Filtro de categoria */}
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de ordenação */}
            <Select value={`${sortColumn}-${sortDirection}`} onValueChange={(value) => {
              const [newSortColumn, newSortDirection] = value.split('-') as [typeof sortColumn, typeof sortDirection];
              setSortColumn(newSortColumn);
              setSortDirection(newSortDirection);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
                <SelectItem value="name-desc">Nome Z-A</SelectItem>
                <SelectItem value="totalCost-asc">Menor Custo</SelectItem>
                <SelectItem value="totalCost-desc">Maior Custo</SelectItem>
                <SelectItem value="marginPercentage-asc">Menor Margem</SelectItem>
                <SelectItem value="marginPercentage-desc">Maior Margem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-green-100 text-green-700">
                    Ativo
                  </Badge>
                  {product.isAlsoIngredient && (
                    <Badge className="bg-blue-100 text-blue-700" title="Também usado como ingrediente">
                      <Layers className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </div>

              {product.cost ? (
                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Composição do Custo:</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">• Ingredientes:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(product.cost.ingredientsCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">• Custo fixo ({product.cost.preparationTimeMinutes}min):</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(product.cost.fixedCostPerProduct)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm font-medium">
                      <span className="text-gray-900">Custo Total:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(product.cost.totalCost)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rendimento:</span>
                      <span className="font-semibold text-gray-900">
                        {product.yield} {product.yieldUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Custo por unidade:</span>
                      <span className="font-semibold text-blue-700">
                        {product.yield > 0 ? formatCurrency(product.cost.totalCost / product.yield) : '-'} / {product.yieldUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Preço Sugerido ({product.marginPercentage}%):</span>
                      <span className="font-semibold text-primary">
                        {product.yield > 0
                          ? `${formatCurrency(product.cost.suggestedPrice / product.yield)} / ${product.yieldUnit}`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm items-center rounded-md px-2 py-1 bg-blue-50 border border-blue-200">
                      <span className="text-blue-800 font-medium">Preço de Venda (unit.)</span>
                      <span className="font-bold text-blue-700">
                        {product.cost && product.yield > 0
                          ? `${formatCurrency(product.cost.salePricePerUnit)} / ${product.yieldUnit}`
                          : (product.yield > 0 ? `${formatCurrency(product.salePrice / product.yield)} / ${product.yieldUnit}` : formatCurrency(product.salePrice))}
                      </span>
                    </div>
                    {(() => {
                      const yieldValue = product.yield || 1;
                      const invalid = yieldValue <= 0 || product.salePrice == null;
                      let costPerUnit = 0;
                      let profitPerUnitRaw = 0;
                      let marginPercentRaw = 0;
                      let salePricePerUnit = 0;
                      if (!invalid) {
                        costPerUnit = product.cost.totalCost / yieldValue;
                        salePricePerUnit = product.cost?.salePricePerUnit ?? (product.salePrice / yieldValue);
                        profitPerUnitRaw = salePricePerUnit - costPerUnit;
                        marginPercentRaw = salePricePerUnit > 0 ? (profitPerUnitRaw / salePricePerUnit) * 100 : 0;
                      }
                      const EPS_PROFIT = 0.005;
                      const EPS_MARGIN = 0.05;
                      const isNeutral = !invalid && Math.abs(profitPerUnitRaw) < EPS_PROFIT;
                      const profitPerUnit = isNeutral ? 0 : profitPerUnitRaw;
                      const marginPercent = isNeutral || Math.abs(marginPercentRaw) < EPS_MARGIN ? 0 : marginPercentRaw;
                      let bg = 'bg-gray-50';
                      let border = 'border-gray-200';
                      let labelColor = 'text-gray-700';
                      let valueColor = 'text-gray-700';
                      if (!invalid) {
                        if (profitPerUnit > 0) {
                          bg = 'bg-green-50'; border = 'border-green-200'; labelColor = 'text-green-800'; valueColor = 'text-green-600';
                        } else if (profitPerUnit < 0) {
                          bg = 'bg-red-50'; border = 'border-red-200'; labelColor = 'text-red-800'; valueColor = 'text-red-600';
                        } else { // neutro
                          bg = 'bg-yellow-50'; border = 'border-yellow-200'; labelColor = 'text-yellow-800'; valueColor = 'text-yellow-700';
                        }
                      }
                      const profitDisplay = invalid ? '-' : `${formatCurrency(profitPerUnit)} / ${product.yieldUnit}`;
                      const marginDisplay = !invalid ? ` (${marginPercent.toFixed(1)}%)` : '';
                      return (
                        <div className={`flex justify-between text-sm items-center rounded-md px-2 py-1 mt-1 border ${bg} ${border}`}>
                          <span className={`${labelColor} font-medium`}>Margem de Lucro{marginDisplay}</span>
                          <span className={`font-bold ${valueColor}`}>{profitDisplay}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Adicione ingredientes à receita para calcular o custo
                  </p>
                </div>
              )}

              {product.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                </div>
              )}

              {/* Recipe ingredients display */}
              {(() => {
                const productDetail = productDetails?.find(p => p.id === product.id);
                if (productDetail?.recipes && productDetail.recipes.length > 0) {
                  return (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Receita:</h4>
                      <div className="space-y-1">
                        {productDetail.recipes.map((recipe: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 flex justify-between">
                            <span>
                              {recipe.ingredient ? recipe.ingredient.name :
                                recipe.productIngredient ? recipe.productIngredient.name :
                                  'Ingrediente não encontrado'}
                            </span>
                            <span>{recipe.quantity} {recipe.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                <div className="text-xs text-gray-400">
                  {formatRelativeTime(new Date(product.updatedAt))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          {/* Desktop Pagination */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const page = startPage + i;

                if (page > totalPages) return null;

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>

          {/* Mobile Pagination */}
          <div className="lg:hidden flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3"
            >
              ‹
            </Button>

            <span className="text-sm text-gray-600 min-w-[100px] text-center">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3"
            >
              ›
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma receita encontrada com os filtros aplicados.</p>
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setCategoryFilter("all"); }}
                >
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {products.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma receita cadastrada ainda.</p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira receita
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ProductForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        product={editingProduct}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a receita "${productToDelete?.name}"? Esta ação não pode ser desfeita e irá remover todas as receitas associadas.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
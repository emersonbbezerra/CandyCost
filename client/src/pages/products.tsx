import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductForm } from "@/components/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@shared/constants";
import type { Product, ProductCost } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, Edit, Filter, Layers, Plus, Search, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

type ProductWithCost = Product & { cost?: ProductCost };

export default function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Mark that user was on products page for dashboard cache invalidation
  useEffect(() => {
    sessionStorage.setItem('lastPageNavigation', 'products');
  }, []);
  const [editingProduct, setEditingProduct] = useState<ProductWithCost | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<"name" | "totalCost" | "marginPercentage">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithCost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<ProductWithCost[]>({
    queryKey: ["/api/products"],
  });

  // Query to get detailed product with recipes when needed
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
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = async (product: ProductWithCost) => {
    try {
      console.log("Editando produto:", product);
      const response = await apiRequest("GET", `/api/products/${product.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const productWithRecipes = await response.json();
      console.log("Produto carregado do servidor:", productWithRecipes);
      
      // Ensure the product has the required structure
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
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do produto. Tente novamente.",
        variant: "destructive",
      });
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

  // Filtrar produtos baseado na pesquisa e categoria
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Ordenar produtos
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

  // Paginação
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
    <div className="p-4 lg:p-8">
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
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={`${sortColumn}-${sortDirection}`} onValueChange={(value) => {
                const [newSortColumn, newSortDirection] = value.split('-') as [typeof sortColumn, typeof sortDirection];
                setSortColumn(newSortColumn);
                setSortDirection(newSortDirection);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="totalCost-asc">Menor Custo</SelectItem>
                  <SelectItem value="totalCost-desc">Maior Custo</SelectItem>
                  <SelectItem value="marginPercentage-asc">Menor Margem</SelectItem>
                  <SelectItem value="marginPercentage-desc">Maior Margem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-gray-400" />
            </div>

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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Preço Sugerido ({product.marginPercentage}%):</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(product.cost.suggestedPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Margem de Lucro:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(product.cost.margin)}
                    </span>
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
                    <Trash2 className="w-4 h-4" />
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

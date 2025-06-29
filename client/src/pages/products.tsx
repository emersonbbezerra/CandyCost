import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, History, ChefHat, Layers } from "lucide-react";
import { ProductForm } from "@/components/product-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { Product, ProductCost } from "@shared/schema";

type ProductWithCost = Product & { cost?: ProductCost };

export default function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCost | undefined>();
  
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
      const productWithRecipes = await response.json();
      console.log("Produto carregado do servidor:", productWithRecipes);
      setEditingProduct(productWithRecipes);
      setIsFormOpen(true);
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do produto.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (product: ProductWithCost) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

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
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Receitas</h2>
            <p className="text-gray-600 mt-2">Gerencie receitas e produtos com cálculo de custos</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Custo de Produção:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(product.cost.totalCost)}
                    </span>
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
    </div>
  );
}

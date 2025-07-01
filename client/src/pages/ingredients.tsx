import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, History, Filter } from "lucide-react";
import { IngredientForm } from "@/components/ingredient-form";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { Ingredient } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/constants";

const categoryColors = {
  "Laticínios": "bg-green-100 text-green-800",
  "Farinhas": "bg-blue-100 text-blue-800",
  "Açúcares": "bg-yellow-100 text-yellow-800",
  "Chocolates": "bg-purple-100 text-purple-800",
  "Frutas": "bg-orange-100 text-orange-800",
  "Outros": "bg-gray-100 text-gray-800",
};

export default function Ingredients() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ingredients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      toast({
        title: "Sucesso",
        description: "Ingrediente excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir ingrediente. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsFormOpen(true);
  };

  const handleDelete = (ingredient: Ingredient) => {
    setIngredientToDelete(ingredient);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (ingredientToDelete) {
      deleteMutation.mutate(ingredientToDelete.id);
      setDeleteConfirmOpen(false);
      setIngredientToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingIngredient(undefined);
  };

  const calculateUnitCost = (ingredient: Ingredient) => {
    const price = parseFloat(ingredient.price);
    const quantity = parseFloat(ingredient.quantity);
    return price / quantity;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Ingredientes</h2>
            <p className="text-gray-600 mt-2">Gerencie todos os ingredientes e insumos</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Ingrediente
          </Button>
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
                  placeholder="Buscar ingredientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {INGREDIENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ingredientes ({filteredIngredients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Embalagem</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Custo/Unidade</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {ingredient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{ingredient.name}</div>
                        {ingredient.brand && (
                          <div className="text-sm text-gray-500">{ingredient.brand}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={categoryColors[ingredient.category as keyof typeof categoryColors] || categoryColors.Outros}
                    >
                      {ingredient.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{ingredient.quantity} {ingredient.unit}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parseFloat(ingredient.price))}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatCurrency(calculateUnitCost(ingredient))} / {ingredient.unit}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatRelativeTime(new Date(ingredient.updatedAt))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ingredient)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ingredient)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredIngredients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum ingrediente encontrado.</p>
              {searchTerm || categoryFilter ? (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca.</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar primeiro ingrediente
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <IngredientForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        ingredient={editingIngredient}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o ingrediente "${ingredientToDelete?.name}"? Esta ação não pode ser desfeita e pode afetar receitas que usam este ingrediente.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

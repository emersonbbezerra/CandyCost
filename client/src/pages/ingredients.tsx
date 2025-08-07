import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { IngredientForm } from "@/components/ingredient-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { INGREDIENT_CATEGORIES } from "@shared/constants";
import type { Ingredient } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Edit, Filter, Package, Plus, Search, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

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

  // Mark navigation and updates for dashboard refresh control
  useEffect(() => {
    // Clear update markers upon entering the page
    sessionStorage.removeItem('hasRecentUpdates');

    return () => {
      sessionStorage.setItem('lastPageNavigation', 'ingredients');
    };
  }, []);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceMinFilter, setPriceMinFilter] = useState("");
  const [priceMaxFilter, setPriceMaxFilter] = useState("");
  const [unitCostMinFilter, setUnitCostMinFilter] = useState("");
  const [unitCostMaxFilter, setUnitCostMaxFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // options: all, 7, 30, 90
  const [sortColumn, setSortColumn] = useState<keyof Ingredient | "unitCost" | "updatedAt" | "name" | "category" | "price" | "quantity" | "brand">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const calculateUnitCost = (ingredient: Ingredient) => {
    const price = parseFloat(ingredient.price);
    const quantity = parseFloat(ingredient.quantity);
    return price / quantity;
  };

  const formatUnit = (unit: string) => {
    if (unit === "unidade") {
      return "und";
    }
    return unit;
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch =
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter;

    const price = parseFloat(ingredient.price);
    const unitCost = calculateUnitCost(ingredient);

    const matchesPriceMin = priceMinFilter === "" || price >= parseFloat(priceMinFilter);
    const matchesPriceMax = priceMaxFilter === "" || price <= parseFloat(priceMaxFilter);
    const matchesUnitCostMin = unitCostMinFilter === "" || unitCost >= parseFloat(unitCostMinFilter);
    const matchesUnitCostMax = unitCostMaxFilter === "" || unitCost <= parseFloat(unitCostMaxFilter);

    let matchesDate = true;
    if (dateFilter !== "all") {
      const days = parseInt(dateFilter);
      const updatedAt = new Date(ingredient.updatedAt);
      const now = new Date();
      const diffTime = now.getTime() - updatedAt.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      matchesDate = diffDays <= days;
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesUnitCostMin &&
      matchesUnitCostMax &&
      matchesDate
    );
  });

  const sortedIngredients = filteredIngredients.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "category":
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case "price":
        aValue = parseFloat(a.price);
        bValue = parseFloat(b.price);
        break;
      case "unitCost":
        aValue = calculateUnitCost(a);
        bValue = calculateUnitCost(b);
        break;
      case "updatedAt":
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      default:
        aValue = a[sortColumn];
        bValue = b[sortColumn];
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginação
  const totalPages = Math.ceil(sortedIngredients.length / itemsPerPage);
  const paginatedIngredients = sortedIngredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const toggleSort = (column: keyof Ingredient | "unitCost" | "updatedAt" | "name" | "category" | "price" | "quantity" | "brand") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
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
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-blue-600" />
            Ingredientes
          </h2>
          <p className="text-gray-600 mt-2">Gerencie todos os ingredientes e insumos</p>
          <div className="mt-4">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Ingrediente
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar ingredientes..."
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
                  {INGREDIENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Novos filtros adicionais */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex space-x-2 max-w-md">
              <Input
                type="number"
                placeholder="Preço mínimo"
                value={priceMinFilter}
                onChange={(e) => {
                  setPriceMinFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-32"
                min={0}
              />
              <Input
                type="number"
                placeholder="Preço máximo"
                value={priceMaxFilter}
                onChange={(e) => {
                  setPriceMaxFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-32"
                min={0}
              />
            </div>
            <div className="flex space-x-2 max-w-md">
              <Input
                type="number"
                placeholder="Custo/unidade mínimo"
                value={unitCostMinFilter}
                onChange={(e) => {
                  setUnitCostMinFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
                min={0}
              />
              <Input
                type="number"
                placeholder="Custo/unidade máximo"
                value={unitCostMaxFilter}
                onChange={(e) => {
                  setUnitCostMaxFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
                min={0}
              />
            </div>
            <div className="max-w-xs">
              <Select value={dateFilter} onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Última atualização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ingredientes ({filteredIngredients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("name")}
                  >
                    Ingrediente
                    {sortColumn === "name" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1" />
                      )
                    ) : null}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("category")}
                  >
                    Categoria
                    {sortColumn === "category" && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1" />
                      )
                    )}
                  </TableHead>
                  <TableHead>Embalagem</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("price")}
                  >
                    Preço
                    {sortColumn === "price" && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1" />
                      )
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("unitCost")}
                  >
                    Custo/Unidade
                    {sortColumn === "unitCost" && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1" />
                      )
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("updatedAt")}
                  >
                    Última Atualização
                    {sortColumn === "updatedAt" && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1" />
                      )
                    )}
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIngredients.map((ingredient) => (
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
                      {formatCurrency(calculateUnitCost(ingredient))} / {formatUnit(ingredient.unit)}
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
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {paginatedIngredients.map((ingredient) => (
              <Card key={ingredient.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold">
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
                    <div className="flex items-center space-x-1">
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Categoria:</span>
                      <Badge
                        className={categoryColors[ingredient.category as keyof typeof categoryColors] || categoryColors.Outros}
                      >
                        {ingredient.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Embalagem:</span>
                      <span className="text-sm font-medium">{ingredient.quantity} {ingredient.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Preço:</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(parseFloat(ingredient.price))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Custo/Unidade:</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(calculateUnitCost(ingredient))} / {formatUnit(ingredient.unit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                      <span className="text-xs text-gray-400">Atualizado:</span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(new Date(ingredient.updatedAt))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {sortedIngredients.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
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
          {sortedIngredients.length === 0 && (
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
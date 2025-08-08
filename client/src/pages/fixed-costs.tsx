import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FixedCostForm } from "@/components/fixed-cost-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { FIXED_COST_CATEGORIES, RECURRENCE_TYPES } from "@shared/constants";
import type { FixedCost, InsertFixedCost } from "@shared/schema";
import { 
  Calculator, 
  Edit, 
  Plus, 
  Trash2, 
  Search, 
  Filter,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  TrendingUp
} from "lucide-react";

export default function FixedCosts() {
  const [selectedFixedCost, setSelectedFixedCost] = useState<FixedCost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FixedCost | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fixedCosts = [], isLoading } = useQuery<FixedCost[]>({
    queryKey: ["/api/fixed-costs"],
  });

  const { data: monthlyTotal } = useQuery<{ monthlyTotal: number }>({
    queryKey: ["/api/fixed-costs/monthly-total"],
  });

  const { data: costsByCategory } = useQuery<Record<string, { total: number; costs: FixedCost[] }>>({
    queryKey: ["/api/fixed-costs/by-category"],
  });

  const { data: costPerHourData } = useQuery<{ costPerHour: number }>({
    queryKey: ["/api/fixed-costs/cost-per-hour"],
  });

  const { data: workConfig } = useQuery<{ hoursPerDay: number; daysPerMonth: number; hourlyRate: number; highCostAlertThreshold: number }>({
    queryKey: ["/api/fixed-costs/work-configuration"],
  });


  const createMutation = useMutation({
    mutationFn: (data: InsertFixedCost) => 
      apiRequest("POST", "/api/fixed-costs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/monthly-total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/cost-per-hour"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Custo fixo criado com sucesso!" });
      setShowForm(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar custo fixo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertFixedCost> }) =>
      apiRequest("PUT", `/api/fixed-costs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/monthly-total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/cost-per-hour"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Custo fixo atualizado com sucesso!" });
      setShowForm(false);
      setSelectedFixedCost(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar custo fixo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/fixed-costs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/monthly-total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Custo fixo excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/fixed-costs/${id}/toggle`, { isActive: true });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-costs/monthly-total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Status do custo fixo alterado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredFixedCosts = fixedCosts.filter(cost => {
    const matchesSearch = cost.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cost.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || cost.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && cost.isActive) ||
                         (statusFilter === "inactive" && !cost.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = (data: InsertFixedCost) => {
    if (selectedFixedCost) {
      updateMutation.mutate({ id: selectedFixedCost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (fixedCost: FixedCost) => {
    setSelectedFixedCost(fixedCost);
    setShowForm(true);
  };

  const handleDelete = (fixedCost: FixedCost) => {
    setDeleteConfirm(fixedCost);
  };

  const handleToggleActive = (fixedCost: FixedCost) => {
    toggleActiveMutation.mutate(fixedCost.id);
  };

  const getRecurrenceLabel = (recurrence: string) => {
    const found = RECURRENCE_TYPES.find(type => type.value === recurrence);
    return found?.label || recurrence;
  };

  const calculateMonthlyValue = (value: string, recurrence: string) => {
    const numValue = parseFloat(value);
    switch (recurrence) {
      case "monthly": return numValue;
      case "quarterly": return numValue / 3;
      case "yearly": return numValue / 12;
      default: return numValue;
    }
  };

  if (showForm) {
    return (
      <div className="p-4 lg:p-8">
        <FixedCostForm
          fixedCost={selectedFixedCost || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedFixedCost(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Calculator className="w-8 h-8 mr-3 text-blue-600" />
          Custos Fixos
        </h2>
        <p className="text-gray-600 mt-2">
          Gerencie os custos fixos que serão incluídos no cálculo dos produtos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mensal</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(monthlyTotal?.monthlyTotal || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo por Hora</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(costPerHourData?.costPerHour || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calculator className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {FIXED_COST_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Custo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Costs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFixedCosts.map((fixedCost) => (
          <Card key={fixedCost.id} className={!fixedCost.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{fixedCost.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(fixedCost)}
                  >
                    {fixedCost.isActive ? (
                      <ToggleRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(fixedCost)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fixedCost)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="secondary">{fixedCost.category}</Badge>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(fixedCost.value))}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Recorrência:</span>
                  <span>{getRecurrenceLabel(fixedCost.recurrence)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor Mensal:</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(calculateMonthlyValue(fixedCost.value, fixedCost.recurrence))}
                  </span>
                </div>
              </div>

              {fixedCost.description && (
                <p className="text-sm text-gray-600 mt-3">
                  {fixedCost.description}
                </p>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                <span>Status: {fixedCost.isActive ? "Ativo" : "Inativo"}</span>
                <span>{formatRelativeTime(fixedCost.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFixedCosts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum custo fixo encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros ou criar um novo custo fixo."
                : "Comece criando seu primeiro custo fixo."}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Custo Fixo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Excluir Custo Fixo"
        description={`Tem certeza que deseja excluir "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
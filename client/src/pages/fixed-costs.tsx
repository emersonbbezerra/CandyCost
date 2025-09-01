import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FixedCostForm } from "@/components/fixed-cost-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { useCostInvalidation } from "@/hooks/useCostInvalidation";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { FIXED_COST_CATEGORIES, RECURRENCE_TYPES } from "@shared/constants";
import type { FixedCost, InsertFixedCost } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  DollarSign,
  Edit,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2
} from "lucide-react";
import { useState } from "react";

export default function FixedCosts() {
  const [selectedFixedCost, setSelectedFixedCost] = useState<FixedCost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FixedCost | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const costInvalidation = useCostInvalidation();

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


  // Helpers de cálculo local (reutiliza lógica do backend)
  const computeMonthlyValue = (value: number, recurrence: string) => {
    switch (recurrence) {
      case 'monthly': return value;
      case 'quarterly': return value / 3;
      case 'yearly': return value / 12;
      default: return 0;
    }
  };
  const recomputeDerivedCaches = (fixedCostsList: FixedCost[]) => {
    // Fixed costs list already updated externamente
    // Montly total
    const monthlyTotalCalc = fixedCostsList.filter(fc => fc.isActive)
      .reduce((acc, fc) => acc + computeMonthlyValue(Number(fc.value), fc.recurrence), 0);
    queryClient.setQueryData(["/api/fixed-costs/monthly-total"], { monthlyTotal: monthlyTotalCalc });
    // Cost per hour (usa workConfig se carregado)
    if (workConfig) {
      const totalHours = (workConfig.daysPerMonth || 22) * (workConfig.hoursPerDay || 8);
      if (totalHours > 0) {
        queryClient.setQueryData(["/api/fixed-costs/cost-per-hour"], { costPerHour: monthlyTotalCalc / totalHours });
      }
    }
    // By category
    const byCategory: Record<string, { total: number; costs: FixedCost[] }> = {};
    fixedCostsList.filter(fc => fc.isActive).forEach(fc => {
      const mv = computeMonthlyValue(Number(fc.value), fc.recurrence);
      if (!byCategory[fc.category]) byCategory[fc.category] = { total: 0, costs: [] };
      byCategory[fc.category].total += mv;
      byCategory[fc.category].costs.push(fc);
    });
    queryClient.setQueryData(["/api/fixed-costs/by-category"], byCategory);
  };

  // CREATE
  const createMutation = useMutation({
    mutationFn: async (data: InsertFixedCost) => {
      const res = await apiRequest("POST", "/api/fixed-costs", data);
      return res.json() as Promise<FixedCost>;
    },
    onSuccess: (newCost) => {
      // Atualiza lista local otimisticamente
      queryClient.setQueryData<FixedCost[]>(["/api/fixed-costs"], (old = []) => [newCost, ...old]);
      recomputeDerivedCaches([newCost, ...(queryClient.getQueryData<FixedCost[]>(["/api/fixed-costs"]) || [])]);

      // Usar sistema de invalidação centralizado
      costInvalidation.invalidateOnFixedCostChange();

      successToast("Sucesso", "Custo fixo criado com sucesso! Todos os custos foram recalculados.");
      setShowForm(false);
    },
    onError: () => {
      errorToast("Erro", "Erro ao criar custo fixo");
    },
  });

  // UPDATE (id é string - cuid)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertFixedCost> }) => {
      const res = await apiRequest("PUT", `/api/fixed-costs/${id}`, data);
      return res.json() as Promise<FixedCost>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<FixedCost[]>(["/api/fixed-costs"], (old = []) => old.map(fc => fc.id === updated.id ? updated : fc));
      recomputeDerivedCaches((queryClient.getQueryData<FixedCost[]>(["/api/fixed-costs"]) || []));

      // Usar sistema de invalidação centralizado
      costInvalidation.invalidateOnFixedCostChange();

      successToast("Sucesso", "Custo fixo atualizado com sucesso! Todos os custos foram recalculados.");
      setShowForm(false);
      setSelectedFixedCost(null);
    },
    onError: () => {
      errorToast("Erro", "Erro ao atualizar custo fixo");
    },
  });

  // DELETE (id é string)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fixed-costs/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<FixedCost[]>(["/api/fixed-costs"], (old = []) => old.filter(fc => fc.id !== id));
      recomputeDerivedCaches((queryClient.getQueryData<FixedCost[]>(["/api/fixed-costs"]) || []));

      // Usar sistema de invalidação centralizado
      costInvalidation.invalidateOnFixedCostChange();

      successToast("Sucesso", "Custo fixo excluído com sucesso! Todos os custos foram recalculados.");
    },
    onError: (error: Error) => {
      errorToast("Erro", error.message);
    },
  });

  // TOGGLE ACTIVE (id é string)
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      // Otimista antes da requisição
      const previous = queryClient.getQueryData<FixedCost[]>(["/api/fixed-costs"]);
      if (previous) {
        const toggled = previous.map(fc => fc.id === id ? { ...fc, isActive: !fc.isActive } : fc);
        queryClient.setQueryData(["/api/fixed-costs"], toggled);
        recomputeDerivedCaches(toggled);
      }
      const response = await apiRequest("PATCH", `/api/fixed-costs/${id}/toggle`, {});
      return response.json() as Promise<FixedCost>;
    },
    onSuccess: (updated) => {
      // Garante estado final igual servidor
      queryClient.setQueryData<FixedCost[]>(["/api/fixed-costs"], (old = []) => old.map(fc => fc.id === updated.id ? updated : fc));
      recomputeDerivedCaches((queryClient.getQueryData<FixedCost[]>(["/api/fixed-costs"]) || []));
      costInvalidation.invalidateOnFixedCostChange();
      successToast("Sucesso", "Status do custo fixo alterado com sucesso!");
    },
    onError: (error: Error) => {
      errorToast("Erro", error.message);
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
      createMutation.mutate({ ...data, value: typeof data.value === 'string' ? parseFloat(data.value) : data.value });
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

  const calculateMonthlyValue = (value: string | number, recurrence: string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
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
    <div className="p-4 lg:p-8 w-full min-w-0 overflow-x-hidden">
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
              <SelectContent className="max-h-[200px] overflow-y-auto">
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
              <SelectContent className="max-h-[200px] overflow-y-auto">
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
                    {formatCurrency(typeof fixedCost.value === 'string' ? parseFloat(fixedCost.value) : fixedCost.value)}
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
        open={!!deleteConfirm}
        onOpenChange={open => { if (!open) setDeleteConfirm(null); }}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Excluir Custo Fixo"
        description={`Tem certeza que deseja excluir "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        variant="destructive"
        confirmText="Excluir"
        cancelText="Cancelar"
      // isLoading removido, não existe na interface do componente
      />
    </div>
  );
}
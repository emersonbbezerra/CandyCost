import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrencySymbol } from "@/contexts/SettingsContext";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { useCostInvalidation } from "@/hooks/useCostInvalidation";
import { useDashboardIngredientUpdates } from "@/hooks/useDashboardIngredientUpdates";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { INGREDIENT_CATEGORIES, UNITS } from "@shared/constants";
import { insertIngredientSchema, type Ingredient } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface IngredientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient;
}

export function IngredientForm({ open, onOpenChange, ingredient }: IngredientFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const costInvalidation = useCostInvalidation();
  const { invalidateIngredientUpdates } = useDashboardIngredientUpdates();
  const currencySymbol = useCurrencySymbol();
  const formatCurrencyWithSymbol = useFormatCurrency();

  const form = useForm<z.infer<typeof insertIngredientSchema>>({
    resolver: zodResolver(insertIngredientSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      price: 0,
      brand: "",
    },
  });

  // Atualizar formulário quando o ingrediente muda
  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name || "",
        category: ingredient.category || "",
        quantity: ingredient.quantity ?? 0,
        unit: ingredient.unit === 'unidade' ? 'un' : (ingredient.unit || ""),
        price: ingredient.price ?? 0,
        brand: ingredient.brand || "",
      });
    } else {
      form.reset({
        name: "",
        category: "",
        quantity: 0,
        unit: "",
        price: 0,
        brand: "",
      });
    }
  }, [ingredient, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertIngredientSchema>) => {
      const response = await apiRequest("POST", "/api/ingredients", data);
      return response.json();
    },
    onSuccess: () => {
      costInvalidation.invalidateOnIngredientChange();
      invalidateIngredientUpdates(); // Invalidação específica para dashboard
      successToast("Sucesso", "Ingrediente criado com sucesso!");
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      errorToast("Erro", "Erro ao criar ingrediente. Tente novamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertIngredientSchema>) => {
      const response = await apiRequest("PUT", `/api/ingredients/${ingredient?.id}`, data);

      if (!response.ok) {
        // Se não foi bem-sucedido, tentar extrair a mensagem de erro específica
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erro ao atualizar ingrediente');
      }

      return response.json();
    },
    onSuccess: (result) => {
      costInvalidation.invalidateOnIngredientChange();
      invalidateIngredientUpdates(); // Invalidação específica para dashboard

      const affectedCount = result.affectedProducts?.length || 0;
      successToast("Sucesso", `Ingrediente atualizado! ${affectedCount > 0 ? `${affectedCount} produtos foram afetados.` : ''}`);
      onOpenChange(false);
      // Marcar que houve navegação da página de ingredientes E que há atualizações
      sessionStorage.setItem('lastPageNavigation', 'ingredients');
      sessionStorage.setItem('hasRecentUpdates', 'true');
    },
    onError: (error: Error) => {
      // Mostrar a mensagem específica do erro, ou uma mensagem genérica como fallback
      const errorMessage = error.message || "Erro ao atualizar ingrediente. Tente novamente.";
      errorToast("Erro", errorMessage);
    },
  });

  const onSubmit = (data: z.infer<typeof insertIngredientSchema>) => {
    // Normaliza unidade canônica
    const normalized = {
      ...data,
      unit: data.unit === 'unidade' ? 'un' : data.unit,
    };
    if (ingredient) {
      updateMutation.mutate(normalized);
    } else {
      createMutation.mutate(normalized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto" aria-describedby="ingredient-form-description">
        <DialogHeader>
          <DialogTitle>
            {ingredient ? "Editar Ingrediente" : "Novo Ingrediente"}
          </DialogTitle>
        </DialogHeader>
        <div id="ingredient-form-description" className="sr-only">
          Formulário para {ingredient ? "editar" : "criar"} ingrediente com informações de nome, categoria, quantidade e preço
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Ingrediente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Farinha de Trigo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {INGREDIENT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900 text-sm">Informações de Preço</h4>
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Compra ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="12.50" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calculadora de custo unitário */}
              {form.watch("price") && form.watch("quantity") && (
                <div className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Custo por unidade:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrencyWithSymbol(
                        parseFloat(String(form.watch("price") ?? "0")) /
                        parseFloat(String(form.watch("quantity") ?? "1"))
                      )}
                      {form.watch("unit") && ` por ${UNITS.find(u => u.value === form.watch("unit"))?.label}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca/Fornecedor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Marca Premium"
                      {...field}
                      onChange={field.onChange}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Ingrediente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
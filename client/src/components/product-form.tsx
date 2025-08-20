import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { useCostInvalidation } from "@/hooks/useCostInvalidation";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { PRODUCT_CATEGORIES, UNITS } from "@shared/constants";
import { type Ingredient, type Product, type ProductCost, type Recipe } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";


// Schema do formulário incluindo recipes
const productFormSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  isAlsoIngredient: z.boolean(),
  marginPercentage: z.number().min(0),
  preparationTimeMinutes: z.number().optional(),
  salePrice: z.number().min(0.01, 'Informe o preço de venda'),
  yield: z.number().min(0.01, 'Informe o rendimento'),
  yieldUnit: z.string().min(1, 'Informe a unidade de rendimento'),
  recipes: z.array(z.object({
    ingredientId: z.string().optional(),
    productIngredientId: z.string().optional(),
    quantity: z.number().min(0),
    unit: z.string().min(1),
  })),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: (Product & { recipes?: Array<Partial<Recipe>>; cost?: Partial<ProductCost> });
}

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const costInvalidation = useCostInvalidation();

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const availableProductIngredients = products.filter((p) => p.isAlsoIngredient && p.id !== product?.id);

  // Função auxiliar para extrair preço unitário seguro
  const extractUnitSalePrice = (p?: ProductFormProps['product']) => {
    if (!p) return 0;
    if (p.cost && typeof p.cost.salePricePerUnit === 'number') return p.cost.salePricePerUnit;
    if (typeof p.salePrice === 'number' && typeof p.yield === 'number' && p.yield > 0) {
      return p.salePrice / p.yield;
    }
    return typeof p.salePrice === 'number' ? p.salePrice : 0;
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    shouldFocusError: false, // Desabilitar foco automático em campos com erro
    defaultValues: {
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
      isAlsoIngredient: product?.isAlsoIngredient ?? false,
      marginPercentage: typeof product?.marginPercentage === "number" ? product.marginPercentage : 60,
      preparationTimeMinutes: typeof product?.preparationTimeMinutes === "number" ? product.preparationTimeMinutes : 60,
      // Campo de entrada representa o PREÇO DE VENDA UNITÁRIO (por unidade de rendimento)
      salePrice: extractUnitSalePrice(product),
      yield: typeof product?.yield === "number" ? product.yield : 1,
      yieldUnit: product?.yieldUnit || "un",
      recipes: product?.recipes?.map((r) => ({
        ingredientId: r.ingredientId ? String(r.ingredientId) : undefined,
        productIngredientId: r.productIngredientId ? String(r.productIngredientId) : undefined,
        quantity: typeof r.quantity === "number" ? r.quantity : 0,
        unit: (r.unit === 'unidade' ? 'un' : r.unit) ?? "kg",
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recipes",
  });

  // Confirmação de remoção de ingrediente da receita
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Controle de foco para novos ingredientes
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const ingredientRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const requestRemove = (index: number) => setConfirmRemoveIndex(index);

  // Função para gerar opções contextuais para cada Combobox (evita duplicatas mas preserva nomes)
  const getIngredientOptionsForIndex = (currentIndex: number): ComboboxOption[] => {
    const currentRecipes = form.watch("recipes") || [];
    const usedIngredientIds = new Set<string>();
    const usedProductIngredientIds = new Set<string>();

    // Coletar ingredientes já utilizados, exceto no índice atual
    currentRecipes.forEach((recipe, index) => {
      if (index !== currentIndex) {
        if (recipe.ingredientId) {
          usedIngredientIds.add(recipe.ingredientId);
        }
        if (recipe.productIngredientId) {
          usedProductIngredientIds.add(recipe.productIngredientId);
        }
      }
    });

    const options = [
      // Ingredientes regulares (filtrar já utilizados, exceto o atual)
      ...ingredients
        .filter((ingredient) => !usedIngredientIds.has(ingredient.id))
        .map((ingredient) => ({
          value: ingredient.id,
          label: ingredient.name,
        })),
      // Produtos que também são ingredientes (filtrar já utilizados, exceto o atual)
      ...availableProductIngredients
        .filter((productIngredient) => !usedProductIngredientIds.has(productIngredient.id))
        .map((productIngredient) => ({
          value: `product-${productIngredient.id}`,
          label: productIngredient.name,
        })),
    ];

    return options;
  };

  const confirmRemove = async () => {
    if (confirmRemoveIndex === null) return;
    try {
      setIsRemoving(true);
      remove(confirmRemoveIndex);
    } finally {
      setIsRemoving(false);
      setConfirmRemoveIndex(null);
    }
  };

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        isAlsoIngredient: Boolean(product.isAlsoIngredient),
        marginPercentage: typeof product.marginPercentage === "number" ? product.marginPercentage : 60,
        preparationTimeMinutes: typeof product.preparationTimeMinutes === "number" ? product.preparationTimeMinutes : 60,
        salePrice: extractUnitSalePrice(product),
        yield: typeof product.yield === "number" ? product.yield : 1,
        yieldUnit: product.yieldUnit || "un",
        recipes: Array.isArray(product.recipes) ? product.recipes.map((r) => ({
          ingredientId: r.ingredientId ? String(r.ingredientId) : undefined,
          productIngredientId: r.productIngredientId ? String(r.productIngredientId) : undefined,
          quantity: typeof r.quantity === "number" ? r.quantity : 0,
          unit: (r.unit === 'unidade' ? 'un' : r.unit) ?? "kg",
        })) : [],
      });
    } else {
      form.reset({
        name: "",
        category: "",
        description: "",
        isAlsoIngredient: false,
        marginPercentage: 60,
        preparationTimeMinutes: 60,
        salePrice: 0,
        yield: 1,
        yieldUnit: "un",
        recipes: [],
      });
    }
  }, [product, form]);

  // Focar no campo de ingrediente quando um novo item é adicionado
  useEffect(() => {
    if (lastAddedIndex !== null && ingredientRefs.current[lastAddedIndex]) {
      // Usar requestAnimationFrame para garantir que a renderização termine
      const animationFrame = requestAnimationFrame(() => {
        const ingredientField = ingredientRefs.current[lastAddedIndex];
        if (ingredientField) {
          // Focar diretamente no campo de ingrediente
          ingredientField.focus();
        }
        setLastAddedIndex(null);
      });
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [lastAddedIndex, fields]);

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const { recipes, ...productData } = data;
      // Envia salePrice, yield, yieldUnit junto com os dados do produto
      const response = await apiRequest("POST", "/api/products", productData);
      const newProduct = await response.json();
      if (recipes && recipes.length > 0) {
        await apiRequest("POST", `/api/products/${newProduct.id}/recipes`, recipes);
      }
      return newProduct;
    },
    onSuccess: () => {
      costInvalidation.invalidateOnProductChange();
      successToast("Sucesso", "Produto criado com sucesso!");
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      errorToast("Erro", "Erro ao criar produto. Tente novamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const { recipes, ...productData } = data;
      // Envia salePrice, yield, yieldUnit junto com os dados do produto
      const response = await apiRequest("PUT", `/api/products/${product?.id}`, productData);
      const updatedProduct = await response.json();
      if (recipes) {
        await apiRequest("POST", `/api/products/${product?.id}/recipes`, recipes);
      }
      return updatedProduct;
    },
    onSuccess: () => {
      costInvalidation.invalidateOnProductChange();
      // Invalidar também a query específica do produto editado para forçar recálculo de custos
      if (product?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/products", product.id] });
      }
      successToast("Sucesso", "Produto atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      errorToast("Erro", "Erro ao atualizar produto. Tente novamente.");
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    // Normaliza unidades legadas em receitas
    const normalized: ProductFormValues = {
      ...data,
      recipes: (data.recipes || []).map(r => ({
        ...r,
        unit: r.unit === 'unidade' ? 'un' : r.unit,
      })),
    };
    const yieldValueRaw = normalized.yield;
    const yieldValue = yieldValueRaw && yieldValueRaw > 0 ? yieldValueRaw : 1;
    const unitPrice = normalized.salePrice;
    if (isNaN(unitPrice) || unitPrice <= 0) {
      errorToast("Erro", "Preço de venda unitário inválido");
      return;
    }
    const totalSalePrice = Number((unitPrice * yieldValue).toFixed(4));
    if (!isFinite(totalSalePrice) || totalSalePrice <= 0) {
      errorToast("Erro", "Falha ao calcular preço total");
      return;
    }
    const toSend: ProductFormValues = { ...normalized, salePrice: totalSalePrice };

    if (product) {
      updateMutation.mutate(toSend);
    } else {
      createMutation.mutate(toSend);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto" aria-describedby="product-form-description">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        <div id="product-form-description" className="sr-only">
          Formulário para {product ? "editar" : "criar"} produto com informações básicas e receitas
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Torta de Chocolate" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {PRODUCT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (por unidade)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 49.90"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rendimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 12"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yieldUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Rendimento</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="fatia">Fatia</SelectItem>
                          <SelectItem value="porção">Porção</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do produto..."
                      {...field}
                      onChange={field.onChange}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marginPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem de Lucro (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preparationTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Preparo (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 60)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAlsoIngredient"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Também é ingrediente
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este produto pode ser usado como ingrediente em outras receitas
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Receita
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newIndex = fields.length;
                      append({ ingredientId: undefined, productIngredientId: undefined, quantity: 0, unit: "kg" });
                      setLastAddedIndex(newIndex);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Ingrediente
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`recipes.${index}.ingredientId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ingrediente</FormLabel>
                            <FormControl>
                              <Combobox
                                ref={(el) => {
                                  ingredientRefs.current[index] = el;
                                }}
                                options={getIngredientOptionsForIndex(index)}
                                placeholder="Selecione um ingrediente"
                                searchPlaceholder="Buscar ingrediente..."
                                emptyMessage="Nenhum ingrediente encontrado"
                                value={(() => {
                                  const recipe = form.watch(`recipes.${index}`);
                                  if (recipe?.productIngredientId) {
                                    return `product-${recipe.productIngredientId}`;
                                  } else if (recipe?.ingredientId) {
                                    return recipe.ingredientId; // Manter como string
                                  }
                                  return "";
                                })()}
                                onValueChange={(value) => {
                                  if (!value || value === "") {
                                    field.onChange(null);
                                    form.setValue(`recipes.${index}.productIngredientId`, undefined);
                                    form.setValue(`recipes.${index}.unit`, "kg"); // Unidade padrão
                                  } else if (value.startsWith("product-")) {
                                    // This is a product ingredient
                                    const productId = value.replace("product-", "");
                                    const productIngredient = availableProductIngredients.find(p => p.id === productId);
                                    field.onChange(null); // Clear ingredientId
                                    form.setValue(`recipes.${index}.productIngredientId`, productId);
                                    // Definir unidade do produto ingrediente
                                    form.setValue(`recipes.${index}.unit`, productIngredient?.yieldUnit || "un");
                                  } else {
                                    // This is a regular ingredient - manter como string
                                    const ingredient = ingredients.find(ing => ing.id === value);
                                    field.onChange(value);
                                    form.setValue(`recipes.${index}.productIngredientId`, undefined);
                                    // Definir unidade do ingrediente
                                    form.setValue(`recipes.${index}.unit`, ingredient?.unit || "kg");
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`recipes.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.001" placeholder="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`recipes.${index}.unit`}
                        render={({ field }) => {
                          // Obter a unidade do ingrediente selecionado
                          const currentRecipe = form.watch(`recipes.${index}`);
                          let displayUnit = "Unidade";

                          if (currentRecipe?.ingredientId) {
                            const ingredient = ingredients.find(ing => ing.id === currentRecipe.ingredientId);
                            if (ingredient?.unit) {
                              const unitInfo = UNITS.find(u => u.value === ingredient.unit);
                              displayUnit = unitInfo?.label || ingredient.unit;
                            }
                          } else if (currentRecipe?.productIngredientId) {
                            const productIngredient = availableProductIngredients.find(p => p.id === currentRecipe.productIngredientId);
                            if (productIngredient?.yieldUnit) {
                              const unitInfo = UNITS.find(u => u.value === productIngredient.yieldUnit);
                              displayUnit = unitInfo?.label || productIngredient.yieldUnit;
                            }
                          }

                          return (
                            <FormItem>
                              <FormLabel>Unidade</FormLabel>
                              <FormControl>
                                <div className="flex h-10 w-full items-center rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                  {displayUnit}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <AlertDialog open={confirmRemoveIndex === index} onOpenChange={(open) => !open && setConfirmRemoveIndex(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestRemove(index)}
                            className="h-9 w-9 p-0"
                            title="Remover ingrediente"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover ingrediente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação remove o ingrediente desta receita antes de salvar o produto. Tem certeza que deseja continuar?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={confirmRemove} disabled={isRemoving}>
                              {isRemoving ? "Removendo..." : "Remover"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

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
                {isLoading ? "Salvando..." : "Salvar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
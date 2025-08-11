import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { PRODUCT_CATEGORIES, UNITS } from "@shared/constants";
import { type Ingredient, type Product, type Recipe } from "@shared/schema";
// import { z } from "zod"; // já importado acima
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
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
  product?: (Product & { recipes?: Array<Partial<Recipe>> });
}

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const availableProductIngredients = products.filter((p) => p.isAlsoIngredient && p.id !== product?.id);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
      isAlsoIngredient: product?.isAlsoIngredient ?? false,
      marginPercentage: typeof product?.marginPercentage === "number" ? product.marginPercentage : 60,
      preparationTimeMinutes: typeof product?.preparationTimeMinutes === "number" ? product.preparationTimeMinutes : 60,
      salePrice: typeof product?.salePrice === "number" ? product.salePrice : 0,
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

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        isAlsoIngredient: Boolean(product.isAlsoIngredient),
        marginPercentage: typeof product.marginPercentage === "number" ? product.marginPercentage : 60,
        preparationTimeMinutes: typeof product.preparationTimeMinutes === "number" ? product.preparationTimeMinutes : 60,
        salePrice: typeof product.salePrice === "number" ? product.salePrice : 0,
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
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-updates"] });
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar produto. Tente novamente.",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-updates"] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto. Tente novamente.",
        variant: "destructive",
      });
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
    if (product) {
      updateMutation.mutate(normalized);
    } else {
      createMutation.mutate(normalized);
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
                    <FormLabel>Preço de Venda</FormLabel>
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
                    onClick={() => append({ ingredientId: undefined, productIngredientId: undefined, quantity: 0, unit: "kg" })}
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
                            <Select
                              onValueChange={(value) => {
                                if (value === "null") {
                                  field.onChange(null);
                                  // Also clear productIngredientId
                                  form.setValue(`recipes.${index}.productIngredientId`, undefined);
                                } else if (value.startsWith("product-")) {
                                  // This is a product ingredient
                                  const productId = parseInt(value.replace("product-", ""));
                                  field.onChange(null); // Clear ingredientId
                                  form.setValue(`recipes.${index}.productIngredientId`, String(productId));
                                } else {
                                  // This is a regular ingredient
                                  field.onChange(parseInt(value));
                                  form.setValue(`recipes.${index}.productIngredientId`, undefined);
                                }
                              }}
                              value={(() => {
                                const recipe = form.watch(`recipes.${index}`);
                                if (recipe?.productIngredientId) {
                                  return `product-${recipe.productIngredientId}`;
                                } else if (recipe?.ingredientId) {
                                  return recipe.ingredientId.toString();
                                }
                                return "";
                              })()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder="Selecione um ingrediente"
                                  >
                                    {(() => {
                                      const recipe = form.watch(`recipes.${index}`);
                                      if (recipe?.productIngredientId) {
                                        const productIngredient = availableProductIngredients.find(p => p.id === recipe.productIngredientId);
                                        return productIngredient ? productIngredient.name : "Produto não encontrado";
                                      } else if (recipe?.ingredientId) {
                                        const ingredient = ingredients.find(i => i.id === recipe.ingredientId);
                                        return ingredient ? ingredient.name : "Ingrediente não encontrado";
                                      }
                                      return "Selecione um ingrediente";
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[200px] overflow-y-auto">
                                <SelectItem value="null">Selecione...</SelectItem>
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                                {availableProductIngredients.map((productIngredient) => (
                                  <SelectItem key={`product-${productIngredient.id}`} value={`product-${productIngredient.id}`}>
                                    {productIngredient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade</FormLabel>
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

                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
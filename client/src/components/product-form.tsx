import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { insertProductSchema, insertRecipeSchema, type Product, type Ingredient } from "@shared/schema";
import { PRODUCT_CATEGORIES, INGREDIENT_CATEGORIES, UNITS } from "@shared/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const productSchema = insertProductSchema.extend({
  recipes: z.array(
    insertRecipeSchema.omit({ productId: true }).extend({
      ingredientId: z.number().nullable(),
      productIngredientId: z.number().nullable(),
    })
  ).optional(),
});

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product & { recipes?: any[] };
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

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
      isAlsoIngredient: product?.isAlsoIngredient || false,
      marginPercentage: product?.marginPercentage || "60",
      recipes: product?.recipes?.map((r) => ({
        ingredientId: r.ingredientId,
        productIngredientId: r.productIngredientId,
        quantity: r.quantity,
        unit: r.unit,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recipes",
  });

  // Atualizar formulário quando o produto muda
  useEffect(() => {
    if (product) {
      const formData = {
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        isAlsoIngredient: product.isAlsoIngredient || false,
        marginPercentage: product.marginPercentage || "60",
        recipes: product.recipes?.map((r) => ({
          ingredientId: r.ingredientId,
          productIngredientId: null,
          quantity: r.quantity || "",
          unit: r.unit || "",
        })) || [],
      };
      form.reset(formData);
    } else {
      form.reset({
        name: "",
        category: "",
        description: "",
        isAlsoIngredient: false,
        marginPercentage: "60",
        recipes: [],
      });
    }
  }, [product, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      const { recipes, ...productData } = data;
      const response = await apiRequest("POST", "/api/products", productData);
      const newProduct = await response.json();
      
      if (recipes && recipes.length > 0) {
        await apiRequest("POST", `/api/products/${newProduct.id}/recipes`, recipes);
      }
      
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      const { recipes, ...productData } = data;
      const response = await apiRequest("PUT", `/api/products/${product?.id}`, productData);
      const updatedProduct = await response.json();
      
      if (recipes) {
        await apiRequest("POST", `/api/products/${product?.id}/recipes`, recipes);
      }
      
      return updatedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    if (product) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((category) => (
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
                      <Input type="number" step="0.01" placeholder="60" {...field} />
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
                    onClick={() => append({ ingredientId: null, productIngredientId: null, quantity: "", unit: "kg" })}
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
                                  form.setValue(`recipes.${index}.productIngredientId`, null);
                                } else if (value.startsWith("product-")) {
                                  // This is a product ingredient
                                  const productId = parseInt(value.replace("product-", ""));
                                  field.onChange(null); // Clear ingredientId
                                  form.setValue(`recipes.${index}.productIngredientId`, productId);
                                } else {
                                  // This is a regular ingredient
                                  field.onChange(parseInt(value));
                                  form.setValue(`recipes.${index}.productIngredientId`, null);
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
                                        return productIngredient ? `${productIngredient.name} (Produto)` : "Produto não encontrado";
                                      } else if (recipe?.ingredientId) {
                                        const ingredient = ingredients.find(i => i.id === recipe.ingredientId);
                                        return ingredient ? ingredient.name : "Ingrediente não encontrado";
                                      }
                                      return "Selecione um ingrediente";
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="null">Selecione...</SelectItem>
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                                {availableProductIngredients.length > 0 && (
                                  <>
                                    <SelectItem value="separator" disabled>
                                      — Produtos como Ingredientes —
                                    </SelectItem>
                                    {availableProductIngredients.map((productIngredient) => (
                                      <SelectItem key={`product-${productIngredient.id}`} value={`product-${productIngredient.id}`}>
                                        {productIngredient.name} (Produto)
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
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
                              <Input type="number" step="0.001" placeholder="0.5" {...field} />
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
                              <SelectContent>
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

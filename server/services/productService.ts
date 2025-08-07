import { recipes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { ingredientRepository } from "../repositories/ingredientRepository";
import { productRepository } from "../repositories/productRepository";
import { recipeRepository } from "../repositories/recipeRepository";
import { FixedCostService } from "./fixedCostService";

export const productService = {
  async getProducts() {
    return await productRepository.getProducts();
  },

  async getProductWithRecipes(productId: number) {
    const product = await productRepository.getProduct(productId);
    if (!product) return null;

    const productRecipes = await recipeRepository.getProductRecipesWithIngredients(productId);

    return { ...product, recipes: productRecipes };
  },

  async createProduct(data: {
    name: string;
    category: string;
    description?: string;
    isAlsoIngredient?: boolean;
    marginPercentage?: string;
  }) {
    return await productRepository.createProduct(data);
  },

  async updateProduct(productId: number, data: Partial<{
    name: string;
    category: string;
    description?: string;
    isAlsoIngredient?: boolean;
    marginPercentage?: string;
    preparationTimeMinutes?: number;
  }>) {
    // Get current product data before update
    const currentProduct = await productRepository.getProduct(productId);
    if (!currentProduct) {
      throw new Error("Produto não encontrado");
    }

    // Calculate old cost
    let oldCost = 0;
    try {
      const oldCostData = await this.calculateProductCost(productId);
      oldCost = oldCostData.totalCost;
    } catch {
      oldCost = 0;
    }

    // Update the product
    const updatedProduct = await productRepository.updateProduct(productId, data);

    // Always calculate new cost after update
    let newCost = 0;
    try {
      const newCostData = await this.calculateProductCost(productId);
      newCost = newCostData.totalCost;
    } catch {
      newCost = 0;
    }

    // Create price history entry for any product update
    const { priceHistoryService } = await import("./priceHistoryService");

    let changeReason = "Atualização do produto";
    const changedFields = [];

    if (data.name !== undefined) changedFields.push("nome");
    if (data.category !== undefined) changedFields.push("categoria");
    if (data.description !== undefined) changedFields.push("descrição");
    if (data.marginPercentage !== undefined) changedFields.push("margem de lucro");
    if (data.preparationTimeMinutes !== undefined) changedFields.push("tempo de preparo");
    if (data.isAlsoIngredient !== undefined) changedFields.push("configuração de ingrediente");

    if (changedFields.length > 0) {
      changeReason = `Atualização: ${changedFields.join(", ")}`;
    }

    // Always create history entry, even if cost didn't change
    await priceHistoryService.createPriceHistory({
      productId,
      oldPrice: oldCost.toFixed(2),
      newPrice: newCost.toFixed(2),
      changeReason,
      createdAt: new Date(),
    });

    return updatedProduct;
  },

  async deleteProduct(productId: number) {
    // Primeiro deletar as receitas que usam o produto
    await recipeRepository.deleteRecipesByProduct(productId);
    // Depois deletar o produto
    await productRepository.deleteProduct(productId);
  },

  async calculateProductCost(productId: number, estimatedMonthlyProduction: number = 100) {
    const productRecipes = await recipeRepository.getRecipesByProduct(productId);
    let ingredientsCost = 0;

    // Calculate ingredients cost
    for (const recipe of productRecipes) {
      if (recipe.ingredientId === null) continue;
      const ingredient = await ingredientRepository.getIngredient(recipe.ingredientId);
      if (ingredient && ingredient.price) {
        ingredientsCost += parseFloat(ingredient.price) * Number(recipe.quantity);
      }
    }

    // Get product to access marginPercentage and preparationTimeMinutes
    const product = await productRepository.getProduct(productId);
    if (!product) {
      throw new Error("Produto não encontrado");
    }

    const marginPercentage = product.marginPercentage ? parseFloat(product.marginPercentage) : 60;
    const preparationTimeMinutes = product.preparationTimeMinutes || 60;

    // Calculate fixed cost based on preparation time
    const fixedCostService = new FixedCostService();
    const fixedCostPerProduct = await fixedCostService.calculateProductFixedCost(preparationTimeMinutes);

    // Total cost = ingredients + fixed costs
    const totalCost = ingredientsCost + fixedCostPerProduct;
    const suggestedPrice = totalCost * (1 + marginPercentage / 100);
    const margin = suggestedPrice - totalCost;

    return {
      totalCost,
      ingredientsCost,
      fixedCostPerProduct,
      suggestedPrice,
      margin,
      preparationTimeMinutes
    };
  },


  // Métodos para ingredientes
  async getIngredients() {
    return await ingredientRepository.getIngredients();
  },

  async getIngredient(id: number) {
    return await ingredientRepository.getIngredient(id);
  },

  async createIngredient(data: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    price: string;
    brand?: string | null;
  }) {
    return await ingredientRepository.createIngredient(data);
  },

  async updateIngredient(id: number, data: Partial<{
    name: string;
    category: string;
    quantity: string;
    unit: string;
    price: string;
    brand?: string | null;
  }>) {
    console.log("🔄 Updating ingredient", id, "with data:", data);

    // Buscar ingrediente atual para comparação
    const currentIngredient = await ingredientRepository.getIngredient(id);

    if (!currentIngredient) {
      throw new Error("Ingrediente não encontrado");
    }

    // Sempre criar histórico de preço para ingredientes, mesmo se o preço não mudou
    const oldPrice = currentIngredient.price || "0";
    const newPrice = data.price !== undefined ? data.price : oldPrice;

    console.log("💰 Price change for ingredient", id, ":", { oldPrice, newPrice });

    if (data.price !== undefined) {
      // Registrar histórico de preço do ingrediente
      await import("./priceHistoryService").then(async ({ priceHistoryService }) => {
        await priceHistoryService.createPriceHistory({
          ingredientId: id,
          oldPrice: currentIngredient.price ?? "",
          newPrice: data.price ?? "",
          changeReason: "Atualização de preço",
          createdAt: new Date(),
        });

        // Buscar produtos que usam o ingrediente
        const productIds = await this.getProductsUsingIngredient(id);

        // Para cada produto, calcular custo antigo e novo e registrar histórico
        for (const productId of productIds) {
          const oldCost = await this.calculateProductCost(productId);

          // Calcular novo custo simulando alteração do preço do ingrediente
          const productRecipes = await recipeRepository.getRecipesByProduct(productId);
          let newTotalCost = 0;
          for (const recipe of productRecipes) {
            if (recipe.ingredientId === null) continue;
            const ingredient = await ingredientRepository.getIngredient(recipe.ingredientId);
            if (ingredient) {
              let price = ingredient.price;
              if (ingredient.id === id) {
                price = data.price ?? ingredient.price;
              }
              newTotalCost += parseFloat(price) * Number(recipe.quantity);
            }
          }

          console.log("📊 Product cost impact for product", productId, ":", {
            oldCost: oldCost.totalCost.toFixed(2),
            newCost: newTotalCost.toFixed(2)
          });

          // Registrar histórico de custo do produto afetado
          await priceHistoryService.createPriceHistory({
            productId,
            oldPrice: oldCost.totalCost.toFixed(2),
            newPrice: newTotalCost.toFixed(2),
            changeReason: `Alteração no preço do ingrediente: ${currentIngredient.name}`,
            createdAt: new Date(),
          });
        }
      });
    }

    return await ingredientRepository.updateIngredient(id, data);
  },

  async deleteIngredient(id: number) {
    // Primeiro deletar as receitas que usam o ingrediente
    await recipeRepository.deleteRecipesByIngredient(id);
    // Depois deletar o ingrediente
    await ingredientRepository.deleteIngredient(id);
  },

  async getProductsUsingIngredient(ingredientId: number) {
    // Corrigir para buscar receitas por ingredientId
    const productIngredients = await db.select().from(recipes).where(eq(recipes.ingredientId, ingredientId)).execute();
    const productIds = productIngredients.map((pi: any) => pi.productId);
    return productIds;
  }
};
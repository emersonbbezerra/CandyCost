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
  }>) {
    return await productRepository.updateProduct(productId, data);
  },

  async deleteProduct(productId: number) {
    // Primeiro deletar as receitas que usam o produto
    await recipeRepository.deleteRecipesByProduct(productId);
    // Depois deletar o produto
    await productRepository.deleteProduct(productId);
  },

  async calculateProductCost(productId: number, estimatedMonthlyProduction: number = 100) {
    const productRecipes = await recipeRepository.getRecipesByProduct(productId);
    let totalCost = 0;

    for (const recipe of productRecipes) {
      if (recipe.ingredientId === null) continue;
      const ingredient = await ingredientRepository.getIngredient(recipe.ingredientId);
      if (ingredient && ingredient.price) {
        totalCost += parseFloat(ingredient.price) * Number(recipe.quantity);
      }
    }

    // Get product to access marginPercentage
    const product = await productRepository.getProduct(productId);
    const marginPercentage = product?.marginPercentage ? parseFloat(product.marginPercentage) : 60;

    const suggestedPrice = totalCost * (1 + marginPercentage / 100);
    const margin = suggestedPrice - totalCost;

    return { totalCost, suggestedPrice, margin };
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
    const currentIngredient = await ingredientRepository.getIngredient(id);
    if (!currentIngredient) {
      throw new Error("Ingrediente não encontrado");
    }

    if (data.price !== undefined && data.price !== currentIngredient.price) {
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

          await priceHistoryService.createPriceHistory({
            productId,
            oldPrice: oldCost.totalCost.toFixed(2),
            newPrice: newTotalCost.toFixed(2),
            changeReason: `Atualização de custo devido à alteração do ingrediente ${currentIngredient.name}`,
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
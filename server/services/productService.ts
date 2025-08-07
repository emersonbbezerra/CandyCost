import { recipes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { ingredientRepository } from "../repositories/ingredientRepository";
import { productRepository } from "../repositories/productRepository";
import { recipeRepository } from "../repositories/recipeRepository";
import { FixedCostService } from "./fixedCostService";
import { priceHistoryService } from "./priceHistoryService";
import type { InsertProduct } from "@shared/schema";

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

  async updateProduct(id: number, productData: Partial<InsertProduct>) {
    console.log("Updating product:", id, productData);

    // Calcular custo antes da atualização para comparação
    const oldProduct = await productRepository.getProductById(id);
    const oldCost = oldProduct ? await this.calculateProductCost(id) : null;

    const result = await productRepository.updateProduct(id, productData);
    console.log("Product updated:", result);

    // Calcular novo custo e registrar mudança se houver
    if (oldCost && result) {
      const newCost = await this.calculateProductCost(id);

      if (newCost && Math.abs(newCost.totalCost - oldCost.totalCost) > 0.01) {
        console.log("Product cost changed, recording history:", {
          productId: id,
          oldCost: oldCost.totalCost,
          newCost: newCost.totalCost
        });

        await priceHistoryService.createPriceHistory({
          productId: id,
          oldPrice: oldCost.totalCost.toFixed(2),
          newPrice: newCost.totalCost.toFixed(2),
          changeReason: "Atualização do produto",
          createdAt: new Date()
        });
      }
    }

    return result;
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

          // Calculate new cost properly including fixed costs
          const productRecipes = await recipeRepository.getRecipesByProduct(productId);
          let newIngredientsCost = 0;

          for (const recipe of productRecipes) {
            if (recipe.ingredientId === null) continue;
            const ingredient = await ingredientRepository.getIngredient(recipe.ingredientId);
            if (ingredient) {
              let price = ingredient.price;
              if (ingredient.id === id) {
                price = data.price ?? ingredient.price;
              }
              newIngredientsCost += parseFloat(price || "0") * Number(recipe.quantity);
            }
          }

          // Add fixed costs to get total cost
          const product = await productRepository.getProduct(productId);
          const preparationTimeMinutes = product?.preparationTimeMinutes || 60;
          const fixedCostService = new FixedCostService();
          const fixedCostPerProduct = await fixedCostService.calculateProductFixedCost(preparationTimeMinutes);
          const newTotalCost = newIngredientsCost + fixedCostPerProduct;

          console.log("📊 Product cost impact for product", productId, ":", {
            oldCost: oldCost.totalCost.toFixed(2),
            newCost: newTotalCost.toFixed(2),
            oldIngredientsCost: oldCost.ingredientsCost.toFixed(2),
            newIngredientsCost: newIngredientsCost.toFixed(2),
            fixedCost: fixedCostPerProduct.toFixed(2)
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
  },

  async calculateProductCosts(productIds?: number[]) {
    try {
      console.log("🧮 Starting product costs calculation...");
      const products = productIds 
        ? await Promise.all(productIds.map(id => productRepository.getProductById(id)))
        : await productRepository.getProducts();

      const validProducts = products.filter(Boolean);
      console.log(`📊 Processing ${validProducts.length} products`);

      const costs = await Promise.all(
        validProducts.map(async (product) => {
          if (!product) return null;

          const cost = await this.calculateProductCost(product.id);
          console.log(`💰 Product ${product.name}: ${cost ? `R$ ${cost.totalCost.toFixed(2)}` : 'No cost data'}`);

          return cost;
        })
      );

      return costs.filter(Boolean);
    } catch (error) {
      console.error("❌ Error calculating product costs:", error);
      return [];
    }
  },

  async trackCostChangesForAffectedProducts(ingredientId: number, oldPrice: string, newPrice: string) {
    try {
      console.log("🔍 Finding products affected by ingredient change:", ingredientId);

      // Buscar todos os produtos que usam este ingrediente
      const allProducts = await productRepository.getProducts();
      const affectedProducts: number[] = [];

      for (const product of allProducts) {
        const recipes = await recipeRepository.getRecipesByProduct(product.id);
        const usesIngredient = recipes.some(recipe => recipe.ingredientId === ingredientId);

        if (usesIngredient) {
          affectedProducts.push(product.id);
        }
      }

      console.log("📊 Affected products:", affectedProducts);

      // Para cada produto afetado, calcular o novo custo e registrar mudança
      for (const productId of affectedProducts) {
        const newCost = await this.calculateProductCost(productId);

        if (newCost) {
          console.log("💰 Recording cost change for product:", productId);
          await priceHistoryService.createPriceHistory({
            productId: productId,
            oldPrice: "0.00", // Custo anterior seria complexo de calcular
            newPrice: newCost.totalCost.toFixed(2),
            changeReason: `Alteração no ingrediente (preço mudou de ${oldPrice} para ${newPrice})`,
            createdAt: new Date()
          });
        }
      }

      return affectedProducts;
    } catch (error) {
      console.error("❌ Error tracking cost changes:", error);
      return [];
    }
  },
};
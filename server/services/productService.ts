
import { prisma } from "../db";
import { productRepository } from "../repositories/productRepository";
import { fixedCostRepository } from "../repositories/fixedCostRepository";
import { priceHistoryRepository } from "../repositories/priceHistoryRepository";
import type { ProductCost, InsertProduct } from "@shared/schema";

export const productService = {
  async getProducts() {
    return await productRepository.findAll();
  },

  async getProductById(id: string) {
    return await productRepository.findById(id);
  },

  async getProductWithRecipes(id: string) {
    return await productRepository.findWithRecipes(id);
  },

  async createProduct(data: InsertProduct) {
    return await productRepository.create(data);
  },

  async updateProduct(id: string, data: Partial<InsertProduct>) {
    return await productRepository.update(id, data);
  },

  async deleteProduct(id: string) {
    await productRepository.delete(id);
  },

  async calculateProductCost(productId: string): Promise<ProductCost> {
    const product = await productRepository.findWithRecipes(productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    let totalCost = 0;

    // Calculate cost from recipe ingredients
    for (const recipe of product.recipes) {
      if (recipe.ingredient) {
        const ingredientPrice = parseFloat(recipe.ingredient.price);
        const ingredientQuantity = parseFloat(recipe.ingredient.quantity);
        const recipeQuantity = parseFloat(recipe.quantity);
        
        const costPerUnit = ingredientPrice / ingredientQuantity;
        const recipeCost = costPerUnit * recipeQuantity;
        totalCost += recipeCost;
      } else if (recipe.productIngredient) {
        // Recursive calculation for product ingredients
        const subProductCost = await this.calculateProductCost(recipe.productIngredient.id);
        const recipeQuantity = parseFloat(recipe.quantity);
        totalCost += subProductCost.totalCost * recipeQuantity;
      }
    }

    // Get work configuration for fixed cost calculation
    const workConfig = await prisma.workConfiguration.findFirst();
    const workDaysPerWeek = workConfig?.workDaysPerWeek || 5;
    const hoursPerDay = parseFloat(workConfig?.hoursPerDay.toString() || "8");
    const weeksPerMonth = parseFloat(workConfig?.weeksPerMonth.toString() || "4");

    const totalWorkHoursPerMonth = workDaysPerWeek * hoursPerDay * weeksPerMonth;
    
    // Calculate total monthly fixed costs
    const fixedCosts = await fixedCostRepository.findActive();
    let totalMonthlyFixedCosts = 0;
    
    for (const fixedCost of fixedCosts) {
      const value = parseFloat(fixedCost.value);
      switch (fixedCost.recurrence) {
        case 'monthly':
          totalMonthlyFixedCosts += value;
          break;
        case 'quarterly':
          totalMonthlyFixedCosts += value / 3;
          break;
        case 'yearly':
          totalMonthlyFixedCosts += value / 12;
          break;
      }
    }

    // Calculate fixed cost per minute
    const fixedCostPerMinute = totalMonthlyFixedCosts / (totalWorkHoursPerMonth * 60);
    
    // Calculate fixed cost for this product based on preparation time
    const fixedCostPerUnit = fixedCostPerMinute * product.preparationTimeMinutes;

    // Calculate suggested price with margin
    const marginPercentage = parseFloat(product.marginPercentage);
    const totalProductCost = totalCost + fixedCostPerUnit;
    const suggestedPrice = totalProductCost * (1 + marginPercentage / 100);

    return {
      productId,
      totalCost: totalProductCost,
      fixedCostPerUnit,
      suggestedPrice,
      margin: marginPercentage
    };
  },

  async updateProductsCostByIngredient(ingredientId: number, oldPrice: string, newPrice: string) {
    // Find products that use this ingredient
    const recipes = await prisma.recipe.findMany({
      where: { ingredientId },
      include: { product: true }
    });

    const updatedProducts = [];

    for (const recipe of recipes) {
      try {
        // Calculate old cost
        const oldCost = await this.calculateProductCostAtPrice(recipe.product.id, ingredientId, oldPrice);
        
        // Calculate new cost
        const newCost = await this.calculateProductCost(recipe.product.id);

        // Create price history entry for the product
        await priceHistoryRepository.create({
          productId: recipe.product.id,
          oldPrice: oldCost.totalCost.toFixed(2),
          newPrice: newCost.totalCost.toFixed(2),
          changeReason: `Alteração no ingrediente (preço mudou de ${oldPrice} para ${newPrice})`
        });

        updatedProducts.push({
          product: recipe.product,
          oldCost: oldCost.totalCost,
          newCost: newCost.totalCost
        });
      } catch (error) {
        console.error(`Erro ao atualizar custo do produto ${recipe.product.name}:`, error);
      }
    }

    return updatedProducts;
  },

  async calculateProductCostAtPrice(productId: number, ingredientId: number, priceOverride: string): Promise<ProductCost> {
    const product = await productRepository.findWithRecipes(productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    let totalCost = 0;

    // Calculate cost from recipe ingredients
    for (const recipe of product.recipes) {
      if (recipe.ingredient) {
        let ingredientPrice = parseFloat(recipe.ingredient.price);
        
        // Use override price if this is the ingredient being updated
        if (recipe.ingredient.id === ingredientId) {
          ingredientPrice = parseFloat(priceOverride);
        }
        
        const ingredientQuantity = parseFloat(recipe.ingredient.quantity);
        const recipeQuantity = parseFloat(recipe.quantity);
        
        const costPerUnit = ingredientPrice / ingredientQuantity;
        const recipeCost = costPerUnit * recipeQuantity;
        totalCost += recipeCost;
      } else if (recipe.productIngredient) {
        // Recursive calculation for product ingredients
        const subProductCost = await this.calculateProductCostAtPrice(recipe.productIngredient.id, ingredientId, priceOverride);
        const recipeQuantity = parseFloat(recipe.quantity);
        totalCost += subProductCost.totalCost * recipeQuantity;
      }
    }

    // Get work configuration for fixed cost calculation
    const workConfig = await prisma.workConfiguration.findFirst();
    const workDaysPerWeek = workConfig?.workDaysPerWeek || 5;
    const hoursPerDay = parseFloat(workConfig?.hoursPerDay.toString() || "8");
    const weeksPerMonth = parseFloat(workConfig?.weeksPerMonth.toString() || "4");

    const totalWorkHoursPerMonth = workDaysPerWeek * hoursPerDay * weeksPerMonth;
    
    // Calculate total monthly fixed costs
    const fixedCosts = await fixedCostRepository.findActive();
    let totalMonthlyFixedCosts = 0;
    
    for (const fixedCost of fixedCosts) {
      const value = parseFloat(fixedCost.value);
      switch (fixedCost.recurrence) {
        case 'monthly':
          totalMonthlyFixedCosts += value;
          break;
        case 'quarterly':
          totalMonthlyFixedCosts += value / 3;
          break;
        case 'yearly':
          totalMonthlyFixedCosts += value / 12;
          break;
      }
    }

    // Calculate fixed cost per minute
    const fixedCostPerMinute = totalMonthlyFixedCosts / (totalWorkHoursPerMonth * 60);
    
    // Calculate fixed cost for this product based on preparation time
    const fixedCostPerUnit = fixedCostPerMinute * product.preparationTimeMinutes;

    // Calculate suggested price with margin
    const marginPercentage = parseFloat(product.marginPercentage);
    const totalProductCost = totalCost + fixedCostPerUnit;
    const suggestedPrice = totalProductCost * (1 + marginPercentage / 100);

    return {
      productId,
      totalCost: totalProductCost,
      fixedCostPerUnit,
      suggestedPrice,
      margin: marginPercentage
    };
  }
};

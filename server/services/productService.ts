import type { Ingredient, InsertProduct, ProductCost } from '@shared/schema';
import { prisma } from '../db';
import { fixedCostRepository } from '../repositories/fixedCostRepository';
import { priceHistoryRepository } from '../repositories/priceHistoryRepository';
import { productRepository } from '../repositories/productRepository';
import { priceHistoryService } from './priceHistoryService'; // Importar o serviço de histórico de preços

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
        const ingredientPrice = parseFloat(String(recipe.ingredient.price));
        const ingredientQuantity = parseFloat(
          String(recipe.ingredient.quantity)
        );
        const recipeQuantity = parseFloat(String(recipe.quantity));

        const costPerUnit = ingredientPrice / ingredientQuantity;
        const recipeCost = costPerUnit * recipeQuantity;
        totalCost += recipeCost;
      } else if (recipe.productIngredient) {
        // Recursive calculation for product ingredients
        const subProductCost = await this.calculateProductCost(
          String(recipe.productIngredient.id)
        );
        const recipeQuantity = parseFloat(String(recipe.quantity));
        totalCost += subProductCost.totalCost * recipeQuantity;
      }
    }

    // Get work configuration for fixed cost calculation
    const workConfig = await prisma.workConfiguration.findFirst();
    const daysPerMonth = workConfig?.daysPerMonth || 22.0;
    const hoursPerDay = workConfig?.hoursPerDay || 8.0;

    const totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;

    // Calculate total monthly fixed costs
    const fixedCosts = await fixedCostRepository.findActive();
    let totalMonthlyFixedCosts = 0;

    for (const fixedCost of fixedCosts) {
      const value = fixedCost.value;
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
    const fixedCostPerMinute =
      totalMonthlyFixedCosts / (totalWorkHoursPerMonth * 60);

    // Calculate fixed cost for this product based on preparation time
    const fixedCostPerUnit =
      fixedCostPerMinute * (product.preparationTimeMinutes ?? 0);

    // Calculate suggested price with margin
    const marginPercentage =
      typeof product.marginPercentage === 'string'
        ? parseFloat(product.marginPercentage)
        : product.marginPercentage;
    const totalProductCost = totalCost + fixedCostPerUnit;
    const suggestedPrice = totalProductCost * (1 + marginPercentage / 100);

    return {
      productId,
      totalCost: totalProductCost,
      ingredientsCost: totalCost,
      fixedCostPerProduct: fixedCostPerUnit,
      fixedCostPerUnit,
      suggestedPrice,
      margin: totalProductCost * (marginPercentage / 100),
      marginPercentage: marginPercentage,
      preparationTimeMinutes: product.preparationTimeMinutes ?? 0,
    };
  },

  async updateProductsCostByIngredient(
    ingredientId: string,
    oldPrice: number,
    newPrice: number
  ) {
    // Find products that use this ingredient
    const recipes = await prisma.recipe.findMany({
      where: { ingredientId },
      include: { product: true },
    });

    const updatedProducts = [];

    for (const recipe of recipes) {
      try {
        // Calculate old cost
        const oldCost = await this.calculateProductCostAtPrice(
          String(recipe.product.id),
          ingredientId,
          String(oldPrice)
        );

        // Calculate new cost
        const newCost = await this.calculateProductCost(
          String(recipe.product.id)
        );

        // Create price history entry for the product
        await priceHistoryRepository.create({
          itemType: 'product',
          itemName: recipe.product.name,
          productId: String(recipe.product.id),
          oldPrice: oldCost.totalCost,
          newPrice: newCost.totalCost,
          changeType: 'ingredient_update',
          description: `Alteração no ingrediente (preço mudou de ${oldPrice} para ${newPrice})`,
        });

        updatedProducts.push({
          product: recipe.product,
          oldCost: oldCost.totalCost,
          newCost: newCost.totalCost,
        });
      } catch (error) {
        console.error(
          `Erro ao atualizar custo do produto ${recipe.product.name}:`,
          error
        );
      }
    }

    return updatedProducts;
  },

  async calculateProductCostAtPrice(
    productId: string,
    ingredientId: string,
    priceOverride: string
  ): Promise<ProductCost> {
    const product = await productRepository.findWithRecipes(productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    let totalCost = 0;

    // Calculate cost from recipe ingredients
    for (const recipe of product.recipes) {
      if (recipe.ingredient) {
        let ingredientPrice = recipe.ingredient.price;

        // Use override price if this is the ingredient being updated
        if (recipe.ingredient.id === ingredientId) {
          ingredientPrice = parseFloat(priceOverride);
        }

        const ingredientQuantity = recipe.ingredient.quantity;
        const recipeQuantity = recipe.quantity;

        const costPerUnit = ingredientPrice / ingredientQuantity;
        const recipeCost = costPerUnit * recipeQuantity;
        totalCost += recipeCost;
      } else if (recipe.productIngredient) {
        // Recursive calculation for product ingredients
        const subProductCost = await this.calculateProductCostAtPrice(
          recipe.productIngredient.id,
          ingredientId,
          priceOverride
        );
        const recipeQuantity = recipe.quantity;
        totalCost += subProductCost.totalCost * recipeQuantity;
      }
    }

    // Get work configuration for fixed cost calculation
    const workConfig = await prisma.workConfiguration.findFirst();
    const daysPerMonth = workConfig?.daysPerMonth || 22.0;
    const hoursPerDay = workConfig?.hoursPerDay || 8.0;

    const totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;

    // Calculate total monthly fixed costs
    const fixedCosts = await fixedCostRepository.findActive();
    let totalMonthlyFixedCosts = 0;

    for (const fixedCost of fixedCosts) {
      const value = fixedCost.value;
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
    const fixedCostPerMinute =
      totalMonthlyFixedCosts / (totalWorkHoursPerMonth * 60);

    // Calculate fixed cost for this product based on preparation time
    const fixedCostPerUnit =
      fixedCostPerMinute * (product.preparationTimeMinutes ?? 0);

    // Calculate suggested price with margin
    const marginPercentage = product.marginPercentage;
    const totalProductCost = totalCost + fixedCostPerUnit;
    const suggestedPrice = totalProductCost * (1 + marginPercentage / 100);

    return {
      productId,
      totalCost: totalProductCost,
      ingredientsCost: totalCost,
      fixedCostPerProduct: fixedCostPerUnit,
      fixedCostPerUnit,
      suggestedPrice,
      margin: totalProductCost * (marginPercentage / 100),
      marginPercentage: marginPercentage,
      preparationTimeMinutes: product.preparationTimeMinutes ?? 0,
    };
  },

  // --- Ingredient Methods ---
  async getIngredients() {
    return await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async getIngredient(id: string) {
    return await prisma.ingredient.findUnique({
      where: { id },
    });
  },

  async createIngredient(data: any) {
    const ingredientData = {
      name: data.name,
      category: data.category,
      quantity: parseFloat(data.quantity),
      unit: data.unit,
      price: parseFloat(data.price),
      brand: data.brand || null,
    };

    return await prisma.ingredient.create({
      data: ingredientData,
    });
  },

  async updateIngredient(id: string, data: any): Promise<Ingredient> {
    const updateData: any = {
      name: data.name,
      category: data.category,
      quantity: parseFloat(data.quantity),
      unit: data.unit,
      price: parseFloat(data.price),
      brand: data.brand || null,
    };

    return await prisma.ingredient.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteIngredient(id: string): Promise<void> {
    await prisma.ingredient.delete({
      where: { id },
    });
  },

  async trackCostChangesForAffectedProducts(
    ingredientId: string,
    oldPrice: number,
    newPrice: number
  ): Promise<void> {
    try {
      console.log(
        `Tracking cost changes for ingredient ${ingredientId}: ${oldPrice} -> ${newPrice}`
      );

      // Buscar todas as receitas que usam este ingrediente
      const recipesWithIngredient = await prisma.recipe.findMany({
        where: { ingredientId },
        include: {
          product: true,
          ingredient: true,
        },
      });

      console.log(
        `Found ${recipesWithIngredient.length} recipes using this ingredient`
      );

      for (const recipe of recipesWithIngredient) {
        const ingredientCostDifference =
          (newPrice - oldPrice) * recipe.quantity;
        console.log(
          `Product ${recipe.product.name} cost change: ${ingredientCostDifference}`
        );

        // Criar entrada no histórico de preços para o produto
        await priceHistoryService.createPriceHistory({
          oldPrice: String(0), // Não temos o custo total anterior facilmente disponível
          newPrice: String(ingredientCostDifference), // Registrar a diferença de custo
          changeReason: `Alteração de preço do ingrediente: ${
            recipe.ingredient?.name || 'desconhecido'
          }`,
          productId: recipe.productId,
        });
      }
    } catch (error) {
      console.error('Error tracking cost changes:', error);
    }
  },
};

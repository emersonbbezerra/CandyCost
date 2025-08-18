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

    // Calcular custo dos ingredientes da receita
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
        // Cálculo recursivo para produtos usados como ingredientes
        const subProductCost = await this.calculateProductCost(
          String(recipe.productIngredient.id)
        );
        const recipeQuantity = parseFloat(String(recipe.quantity));
        totalCost += subProductCost.totalCost * recipeQuantity;
      }
    }

    // Cálculo dos custos fixos proporcionais ao tempo de preparo
    const workConfig = await prisma.workConfiguration.findFirst();
    const daysPerMonth = workConfig?.daysPerMonth || 22.0;
    const hoursPerDay = workConfig?.hoursPerDay || 8.0;
    const totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;
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
    const fixedCostPerMinute =
      totalMonthlyFixedCosts / (totalWorkHoursPerMonth * 60);
    const fixedCostPerUnit =
      fixedCostPerMinute * (product.preparationTimeMinutes ?? 0);

    // Cálculo do custo total de produção
    const totalProductCost = totalCost + fixedCostPerUnit;

    // Cálculo do custo por unidade de rendimento
    const yieldValue = product.yield ?? 1;
    const costPerYieldUnit = totalProductCost / yieldValue;

    // Preço de venda por unidade de rendimento
    const salePricePerUnit = (product.salePrice ?? 0) / yieldValue;

    // Margem real baseada no preço de venda informado
    const marginReal =
      salePricePerUnit > 0
        ? ((salePricePerUnit - costPerYieldUnit) / salePricePerUnit) * 100
        : 0;

    // Cálculo do preço sugerido e margem (mantendo compatibilidade)
    const marginPercentage =
      typeof product.marginPercentage === 'string'
        ? parseFloat(product.marginPercentage)
        : product.marginPercentage;
    const suggestedPrice = totalProductCost * (1 + marginPercentage / 100);
    const margin = totalProductCost * (marginPercentage / 100);
    return {
      productId,
      totalCost: totalProductCost,
      ingredientsCost: totalCost,
      fixedCostPerProduct: fixedCostPerUnit,
      fixedCostPerUnit,
      costPerYieldUnit,
      salePricePerUnit,
      marginReal,
      yield: yieldValue,
      yieldUnit: product.yieldUnit ?? '',
      salePrice: product.salePrice ?? 0,
      marginPercentage: marginPercentage,
      preparationTimeMinutes: product.preparationTimeMinutes ?? 0,
      suggestedPrice,
      margin,
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
      include: { product: true, ingredient: true },
    });

    const updatedProducts = [];

    for (const recipe of recipes) {
      try {
        // Calculate old cost using a per-unit override derived from the provided total old price.
        // Note: This uses the current ingredient quantity as a fallback and may not reflect historical quantity.
        const fallbackQty = parseFloat(
          String(recipe.ingredient?.quantity || 1)
        );
        const oldUnitPrice = parseFloat(String(oldPrice)) / (fallbackQty || 1);
        const oldCost = await this.calculateProductCostAtUnitPrice(
          String(recipe.product.id),
          ingredientId,
          oldUnitPrice
        );

        // Calculate new cost
        const newCost = await this.calculateProductCost(
          String(recipe.product.id)
        );

        // Create price history entry for the product (cost per yield unit)
        const oldCostPerUnit =
          oldCost.costPerYieldUnit ?? oldCost.totalCost / (oldCost.yield || 1);
        const newCostPerUnit =
          newCost.costPerYieldUnit ?? newCost.totalCost / (newCost.yield || 1);
        await priceHistoryRepository.create({
          itemType: 'product',
          itemName: recipe.product.name,
          productId: String(recipe.product.id),
          oldPrice: oldCostPerUnit,
          newPrice: newCostPerUnit,
          changeType: 'ingredient_update',
          description: `Custo por unidade alterado devido a ingrediente (${oldUnitPrice.toFixed(
            4
          )} -> ${(parseFloat(String(newPrice)) / (fallbackQty || 1)).toFixed(
            4
          )})`,
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

  async calculateProductCostAtUnitPrice(
    productId: string,
    ingredientId: string,
    unitPriceOverride: number
  ): Promise<ProductCost> {
    const product = await productRepository.findWithRecipes(productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    let totalCost = 0;

    // Calculate cost from recipe ingredients
    for (const recipe of product.recipes) {
      if (recipe.ingredient) {
        const recipeQuantity = recipe.quantity;
        // Determine per-unit price. If this is the overridden ingredient, use the override directly (already per unit)
        const costPerUnit =
          recipe.ingredient.id === ingredientId
            ? unitPriceOverride
            : parseFloat(String(recipe.ingredient.price)) /
              parseFloat(String(recipe.ingredient.quantity));
        const recipeCost = costPerUnit * recipeQuantity;
        totalCost += recipeCost;
      } else if (recipe.productIngredient) {
        // Recursive calculation for product ingredients
        const subProductCost = await this.calculateProductCostAtUnitPrice(
          recipe.productIngredient.id,
          ingredientId,
          unitPriceOverride
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

    // Cálculo do custo por unidade de rendimento
    const yieldValue = product.yield ?? 1;
    const costPerYieldUnit = totalProductCost / yieldValue;
    // Preço de venda por unidade de rendimento
    const salePricePerUnit = (product.salePrice ?? 0) / yieldValue;
    // Margem real baseada no preço de venda informado
    const marginReal =
      salePricePerUnit > 0
        ? ((salePricePerUnit - costPerYieldUnit) / salePricePerUnit) * 100
        : 0;
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
      costPerYieldUnit,
      salePricePerUnit,
      marginReal,
      yield: yieldValue,
      yieldUnit: product.yieldUnit ?? '',
      salePrice: product.salePrice ?? 0,
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
    oldUnitPrice: number,
    newUnitPrice: number
  ): Promise<void> {
    try {
      console.log('🔄 [trackCostChangesForAffectedProducts] Starting...');
      console.log(
        `🧪 [trackCostChangesForAffectedProducts] Ingredient: ${ingredientId}, Old price: ${oldUnitPrice}, New price: ${newUnitPrice}`
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
        `📊 [trackCostChangesForAffectedProducts] Found ${recipesWithIngredient.length} recipes using this ingredient`
      );

      if (recipesWithIngredient.length === 0) {
        console.log(
          '⚠️ [trackCostChangesForAffectedProducts] No recipes found for this ingredient'
        );
        return;
      }

      for (const recipe of recipesWithIngredient) {
        console.log(
          `🔍 [trackCostChangesForAffectedProducts] Processing product: ${recipe.product?.name} (ID: ${recipe.productId})`
        );

        // Calcular custo total do produto antes da alteração
        console.log(
          '📈 [trackCostChangesForAffectedProducts] Calculating old product cost...'
        );
        const oldProductCost = await this.calculateProductCostAtUnitPrice(
          String(recipe.product.id),
          ingredientId,
          Number(oldUnitPrice)
        );
        console.log(
          `💰 [trackCostChangesForAffectedProducts] Old cost: ${JSON.stringify(
            oldProductCost,
            null,
            2
          )}`
        );

        // Calcular custo total do produto depois da alteração
        console.log(
          '📈 [trackCostChangesForAffectedProducts] Calculating new product cost...'
        );
        const newProductCost = await this.calculateProductCost(
          String(recipe.product.id)
        );
        console.log(
          `💰 [trackCostChangesForAffectedProducts] New cost: ${JSON.stringify(
            newProductCost,
            null,
            2
          )}`
        );

        // Criar entrada no histórico de preços para o produto (custo por unidade)
        const oldUnit =
          oldProductCost.costPerYieldUnit ??
          oldProductCost.totalCost / (oldProductCost.yield || 1);
        const newUnit =
          newProductCost.costPerYieldUnit ??
          newProductCost.totalCost / (newProductCost.yield || 1);

        console.log(
          `📊 [trackCostChangesForAffectedProducts] Unit costs - Old: ${oldUnit}, New: ${newUnit}`
        );

        console.log(
          '📝 [trackCostChangesForAffectedProducts] Creating price history...'
        );
        await priceHistoryService.createPriceHistory({
          itemType: 'product',
          itemName: recipe.product?.name || 'Produto desconhecido',
          oldPrice: oldUnit ?? 0,
          newPrice: newUnit ?? 0,
          changeType: 'ingredient_update',
          changeReason: `Alteração de preço do ingrediente (custo por unidade): ${
            recipe.ingredient?.name || 'desconhecido'
          }`,
          productId: recipe.productId,
        });

        // 🔥 IMPORTANTE: Atualizar o timestamp updatedAt do produto para refletir nas mudanças de "há X minutos"
        console.log(
          `🕐 [trackCostChangesForAffectedProducts] Updating product timestamp for: ${recipe.product?.name}`
        );
        const updateResult = await prisma.product.update({
          where: { id: recipe.productId },
          data: {
            // Forçar atualização do updatedAt sem alterar outros campos
            updatedAt: new Date(),
          },
        });
        console.log(
          `✅ [trackCostChangesForAffectedProducts] Product timestamp updated successfully for: ${recipe.product?.name}`,
          {
            id: updateResult.id,
            name: updateResult.name,
            updatedAt: updateResult.updatedAt,
          }
        );
      }

      console.log(
        '🎉 [trackCostChangesForAffectedProducts] Process completed successfully!'
      );
    } catch (error) {
      console.error(
        '❌ [trackCostChangesForAffectedProducts] Error tracking cost changes:',
        error
      );
    }
  },
};

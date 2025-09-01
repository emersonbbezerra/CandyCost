import type { Ingredient, InsertProduct, ProductCost } from '@shared/schema';
import { prisma } from '../db';
import { fixedCostRepository } from '../repositories/fixedCostRepository';
import { priceHistoryRepository } from '../repositories/priceHistoryRepository';
import { productRepository } from '../repositories/productRepository';
import { calculateIngredientCost } from '../utils/unitConversion';
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
        const ingredientUnit = recipe.ingredient.unit;
        const recipeQuantity = parseFloat(String(recipe.quantity));
        const recipeUnit = recipe.unit;

        // Usar função de conversão de unidades para calcular o custo corretamente
        const recipeCost = calculateIngredientCost(
          ingredientPrice,
          ingredientQuantity,
          ingredientUnit,
          recipeQuantity,
          recipeUnit
        );

        if (recipeCost === null) {
          console.error(
            `Erro ao calcular custo do ingrediente ${recipe.ingredient.name}: 
            Ingrediente: ${ingredientQuantity} ${ingredientUnit} a R$ ${ingredientPrice}
            Receita usa: ${recipeQuantity} ${recipeUnit}
            Conversão de unidades não suportada.`
          );
          // Fallback para o cálculo original se a conversão falhar
          const costPerUnit = ingredientPrice / ingredientQuantity;
          totalCost += costPerUnit * recipeQuantity;
        } else {
          totalCost += recipeCost;
          console.log(
            `Custo calculado para ${recipe.ingredient.name}: 
            Ingrediente: ${ingredientQuantity} ${ingredientUnit} a R$ ${ingredientPrice} (R$ ${(
              ingredientPrice / ingredientQuantity
            ).toFixed(4)}/${ingredientUnit})
            Receita usa: ${recipeQuantity} ${recipeUnit}
            Custo na receita: R$ ${recipeCost.toFixed(4)}`
          );
        }
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

    // Usar nova lógica se disponível, senão usar lógica antiga para compatibilidade
    let totalWorkHoursPerMonth: number;

    if (workConfig?.monthlyWorkingHours) {
      // Nova lógica: usar horas mensais calculadas
      totalWorkHoursPerMonth = workConfig.monthlyWorkingHours;
    } else {
      // Lógica antiga (compatibilidade)
      const daysPerMonth = workConfig?.daysPerMonth || 22.0;
      const hoursPerDay = workConfig?.hoursPerDay || 8.0;
      totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;
    }
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
        const ingredientQuantity = parseFloat(
          String(recipe.ingredient.quantity)
        );
        const ingredientUnit = recipe.ingredient.unit;
        const recipeQuantity = parseFloat(String(recipe.quantity));
        const recipeUnit = recipe.unit;

        // Determine per-unit price. If this is the overridden ingredient, use the override directly
        let costPerUnit: number;
        if (recipe.ingredient.id === ingredientId) {
          costPerUnit = unitPriceOverride;
        } else {
          const ingredientPrice = parseFloat(String(recipe.ingredient.price));
          costPerUnit = ingredientPrice / ingredientQuantity;
        }

        // Usar função de conversão de unidades para calcular o custo corretamente
        let recipeCost: number;
        if (recipe.ingredient.id === ingredientId) {
          // Para o ingrediente com override, usar cálculo com conversão
          const ingredientPrice = costPerUnit * ingredientQuantity; // Preço total baseado no override
          const calculatedCost = calculateIngredientCost(
            ingredientPrice,
            ingredientQuantity,
            ingredientUnit,
            recipeQuantity,
            recipeUnit
          );

          if (calculatedCost === null) {
            // Fallback para cálculo original
            recipeCost = costPerUnit * recipeQuantity;
          } else {
            recipeCost = calculatedCost;
          }
        } else {
          // Para outros ingredientes, usar cálculo normal com conversão
          const ingredientPrice = parseFloat(String(recipe.ingredient.price));
          const calculatedCost = calculateIngredientCost(
            ingredientPrice,
            ingredientQuantity,
            ingredientUnit,
            recipeQuantity,
            recipeUnit
          );

          if (calculatedCost === null) {
            // Fallback para cálculo original
            recipeCost = costPerUnit * recipeQuantity;
          } else {
            recipeCost = calculatedCost;
          }
        }

        totalCost += recipeCost;
      } else if (recipe.productIngredient) {
        // Recursive calculation for product ingredients
        const subProductCost = await this.calculateProductCostAtUnitPrice(
          recipe.productIngredient.id,
          ingredientId,
          unitPriceOverride
        );
        const recipeQuantity = parseFloat(String(recipe.quantity));
        totalCost += subProductCost.totalCost * recipeQuantity;
      }
    }

    // Get work configuration for fixed cost calculation
    const workConfig = await prisma.workConfiguration.findFirst();

    // Usar nova lógica se disponível, senão usar lógica antiga para compatibilidade
    let totalWorkHoursPerMonth: number;

    if (workConfig?.monthlyWorkingHours) {
      // Nova lógica: usar horas mensais calculadas
      totalWorkHoursPerMonth = workConfig.monthlyWorkingHours;
    } else {
      // Lógica antiga (compatibilidade)
      const daysPerMonth = workConfig?.daysPerMonth || 22.0;
      const hoursPerDay = workConfig?.hoursPerDay || 8.0;
      totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;
    }

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

      const processedProducts = new Set<string>();
      const affectedProductIds: string[] = [];

      for (const recipe of recipesWithIngredient) {
        if (processedProducts.has(recipe.productId)) {
          continue;
        }
        processedProducts.add(recipe.productId);

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

        // Calcular custo total do produto depois da alteração
        console.log(
          '📈 [trackCostChangesForAffectedProducts] Calculating new product cost...'
        );
        const newProductCost = await this.calculateProductCost(
          String(recipe.product.id)
        );

        // Criar entrada no histórico de preços para o produto (custo por unidade)
        const oldUnit =
          oldProductCost.costPerYieldUnit ??
          oldProductCost.totalCost / (oldProductCost.yield || 1);
        const newUnit =
          newProductCost.costPerYieldUnit ??
          newProductCost.totalCost / (newProductCost.yield || 1);

        // Só registrar no histórico se houve mudança significativa no custo
        const threshold = 0.0001;
        const costDifference = Math.abs(newUnit - oldUnit);

        console.log(
          `📊 [trackCostChangesForAffectedProducts] Cost comparison for ${
            recipe.product?.name
          }: Old: R$ ${oldUnit.toFixed(4)}, New: R$ ${newUnit.toFixed(
            4
          )}, Diff: R$ ${costDifference.toFixed(4)}`
        );

        if (costDifference > threshold) {
          console.log(
            '📝 [trackCostChangesForAffectedProducts] Creating price history entry (significant change detected)...'
          );

          await priceHistoryService.createPriceHistory({
            itemType: 'product',
            itemName: recipe.product?.name || 'Produto desconhecido',
            oldPrice: oldUnit,
            newPrice: newUnit,
            changeType: 'ingredient_update',
            changeReason: `Custo alterado devido a mudança no ingrediente: ${
              recipe.ingredient?.name || 'desconhecido'
            } (R$ ${oldUnitPrice.toFixed(4)} -> R$ ${newUnitPrice.toFixed(
              4
            )} por unidade)`,
            productId: recipe.productId,
          });

          console.log(
            `✅ [trackCostChangesForAffectedProducts] Price history recorded for product: ${recipe.product?.name}`
          );
        } else {
          console.log(
            `⏭️ [trackCostChangesForAffectedProducts] Cost change too small for ${recipe.product?.name}, skipping history entry`
          );
        }

        // 🔥 IMPORTANTE: Atualizar o timestamp updatedAt do produto para refletir nas mudanças de "há X minutos"
        console.log(
          `🕐 [trackCostChangesForAffectedProducts] Updating product timestamp for: ${recipe.product?.name}`
        );
        await this.updateProductTimestamp(recipe.productId);

        // Adicionar o produto à lista de afetados para propagação
        affectedProductIds.push(recipe.productId);
      }

      // 🚀 NOVA FUNCIONALIDADE: Propagar recursivamente para produtos que usam os produtos afetados como ingredientes
      await this.propagateCostChangeToProductDependencies(
        affectedProductIds,
        processedProducts
      );

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

  // Função auxiliar para atualizar timestamp do produto
  async updateProductTimestamp(productId: string): Promise<void> {
    try {
      const updateResult = await prisma.product.update({
        where: { id: productId },
        data: {
          // Forçar atualização do updatedAt sem alterar outros campos
          updatedAt: new Date(),
        },
      });
      console.log(
        `✅ Product timestamp updated successfully for ID: ${productId}`,
        {
          id: updateResult.id,
          name: updateResult.name,
          updatedAt: updateResult.updatedAt,
        }
      );
    } catch (error) {
      console.error(
        `❌ Failed to update product timestamp for ID: ${productId}`,
        error
      );
    }
  },

  // Função para propagar mudanças de custo na cadeia de dependências
  async propagateCostChangeToProductDependencies(
    affectedProductIds: string[],
    processedProducts: Set<string>
  ): Promise<void> {
    if (affectedProductIds.length === 0) {
      console.log('🔄 No more products to propagate changes to');
      return;
    }

    console.log(
      `🔄 [propagateCostChangeToProductDependencies] Propagating changes to ${affectedProductIds.length} products`
    );

    const nextLevelAffectedProducts: string[] = [];

    for (const productId of affectedProductIds) {
      // Buscar receitas que usam este produto como ingrediente
      const recipesUsingProduct = await prisma.recipe.findMany({
        where: { productIngredientId: productId },
        include: {
          product: true,
          productIngredient: true,
        },
      });

      console.log(
        `📊 [propagateCostChangeToProductDependencies] Found ${recipesUsingProduct.length} recipes using product ${productId} as ingredient`
      );

      for (const recipe of recipesUsingProduct) {
        if (processedProducts.has(recipe.productId)) {
          console.log(
            `⏭️ [propagateCostChangeToProductDependencies] Skipping already processed product: ${recipe.product?.name} (ID: ${recipe.productId})`
          );
          continue;
        }
        processedProducts.add(recipe.productId);

        console.log(
          `🔍 [propagateCostChangeToProductDependencies] Processing dependent product: ${recipe.product?.name} (ID: ${recipe.productId})`
        );

        // Para produtos dependentes, vamos calcular uma diferença estimada baseada no impacto
        const dependentProductIngredient = recipe.productIngredient;

        if (!dependentProductIngredient) {
          console.log(
            '⚠️ [propagateCostChangeToProductDependencies] No product ingredient found, skipping'
          );
          continue;
        }

        // Calcular custo atual do produto dependente
        const currentCost = await this.calculateProductCost(recipe.productId);
        const currentCostPerUnit =
          currentCost.costPerYieldUnit ??
          currentCost.totalCost / (currentCost.yield || 1);

        // Estimar o custo anterior baseado na quantidade do produto-ingrediente usado
        const recipeQuantity = parseFloat(String(recipe.quantity));
        const productIngredientYield = dependentProductIngredient.yield || 1;
        const costPerUnitOfIngredient =
          currentCost.totalCost / productIngredientYield;

        // Simular diferença: usar a proporção da receita para estimar impacto
        const estimatedOldCostPerUnit = currentCostPerUnit * 0.95; // 5% menos como estimativa

        console.log(
          `📊 [propagateCostChangeToProductDependencies] Cost analysis for ${
            recipe.product?.name
          }: Current R$ ${currentCostPerUnit.toFixed(
            4
          )}, Estimated old: R$ ${estimatedOldCostPerUnit.toFixed(4)}`
        );

        // Para registrar no histórico com diferença estimada
        console.log(
          `📝 [propagateCostChangeToProductDependencies] Creating price history for dependent product: ${recipe.product?.name}`
        );

        await priceHistoryService.createPriceHistory({
          itemType: 'product',
          itemName: recipe.product?.name || 'Produto desconhecido',
          oldPrice: estimatedOldCostPerUnit, // Estimativa do valor anterior
          newPrice: currentCostPerUnit, // O valor atual após a propagação
          changeType: 'ingredient_update',
          changeReason: `Custo recalculado em cadeia devido a alteração em produto-ingrediente: ${
            dependentProductIngredient.name || 'desconhecido'
          }`,
          productId: recipe.productId,
        });

        console.log(
          `✅ [propagateCostChangeToProductDependencies] Price history recorded for dependent product: ${recipe.product?.name}`
        ); // Atualizar timestamp do produto dependente
        console.log(
          `🕐 [propagateCostChangeToProductDependencies] Updating timestamp for dependent product: ${recipe.product?.name}`
        );
        await this.updateProductTimestamp(recipe.productId);

        // Adicionar à próxima iteração para continuar a propagação
        nextLevelAffectedProducts.push(recipe.productId);
      }
    }

    // Continuar propagação recursivamente
    if (nextLevelAffectedProducts.length > 0) {
      console.log(
        `🔄 [propagateCostChangeToProductDependencies] Continuing propagation to ${nextLevelAffectedProducts.length} next-level products`
      );
      await this.propagateCostChangeToProductDependencies(
        nextLevelAffectedProducts,
        processedProducts
      );
    }
  },
};

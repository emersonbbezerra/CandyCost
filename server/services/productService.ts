import type { Ingredient, InsertProduct, ProductCost } from '@shared/schema';
import { prisma } from '../db';
import { fixedCostRepository } from '../repositories/fixedCostRepository';
import { priceHistoryRepository } from '../repositories/priceHistoryRepository';
import { productRepository } from '../repositories/productRepository';
import { logUnitConversion } from '../utils/auditLogger.js';
import {
  areUnitsCompatible,
  calculateIngredientCost,
  convertUnits,
} from '../utils/unitConversion.js';
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
    // Buscar produtos que usam este ingrediente
    const recipes = await prisma.recipe.findMany({
      where: { ingredientId },
      include: { product: true, ingredient: true },
    });

    const updatedProducts = [];

    for (const recipe of recipes) {
      try {
        // Calcular custo antigo usando preço unitário derivado do preço total fornecido
        // Nota: Usa a quantidade atual do ingrediente como fallback e pode não refletir quantidade histórica
        const fallbackQty = parseFloat(
          String(recipe.ingredient?.quantity || 1)
        );
        const oldUnitPrice = parseFloat(String(oldPrice)) / (fallbackQty || 1);
        const oldCost = await this.calculateProductCostAtUnitPrice(
          String(recipe.product.id),
          ingredientId,
          oldUnitPrice
        );

        // Calcular novo custo
        const newCost = await this.calculateProductCost(
          String(recipe.product.id)
        );

        // Criar entrada no histórico de preços para o produto (custo por unidade de rendimento)
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

    // Calcular custo dos ingredientes da receita
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

    // Buscar configuração de trabalho para cálculo de custos fixos
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

    // Calcular total mensal de custos fixos
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

    // Calcular custo fixo por minuto
    const fixedCostPerMinute =
      totalMonthlyFixedCosts / (totalWorkHoursPerMonth * 60);

    // Calcular custo fixo para este produto baseado no tempo de preparação
    const fixedCostPerUnit =
      fixedCostPerMinute * (product.preparationTimeMinutes ?? 0);

    // Calcular preço sugerido com margem
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
      // Buscar todas as receitas que usam este ingrediente
      const recipesWithIngredient = await prisma.recipe.findMany({
        where: { ingredientId },
        include: {
          product: true,
          ingredient: true,
        },
      });

      if (recipesWithIngredient.length === 0) {
        return;
      }

      const processedProducts = new Set<string>();
      const affectedProductIds: string[] = [];

      for (const recipe of recipesWithIngredient) {
        if (processedProducts.has(recipe.productId)) {
          continue;
        }
        processedProducts.add(recipe.productId);

        // Calcular custo total do produto antes da alteração
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

        if (costDifference > threshold) {
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
        }

        // 🔥 IMPORTANTE: Atualizar o timestamp updatedAt do produto para refletir nas mudanças de "há X minutos"
        await this.updateProductTimestamp(recipe.productId);

        // Adicionar o produto à lista de afetados para propagação
        affectedProductIds.push(recipe.productId);
      }

      // 🚀 NOVA FUNCIONALIDADE: Propagar recursivamente para produtos que usam os produtos afetados como ingredientes
      await this.propagateCostChangeToProductDependencies(
        affectedProductIds,
        processedProducts
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
      await prisma.product.update({
        where: { id: productId },
        data: {
          // Forçar atualização do updatedAt sem alterar outros campos
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        `❌ Failed to update product timestamp for ID: ${productId}`,
        error
      );
    }
  },

  /**
   * Converte automaticamente as quantidades das receitas quando a unidade do ingrediente é alterada
   * @param ingredientId ID do ingrediente que teve a unidade alterada
   * @param oldUnit Unidade anterior do ingrediente
   * @param newUnit Nova unidade do ingrediente
   * @returns Promise<{ convertedRecipes: number, errors: string[] }>
   */
  async convertRecipeQuantitiesOnUnitChange(
    ingredientId: string,
    oldUnit: string,
    newUnit: string
  ): Promise<{ convertedRecipes: number; errors: string[] }> {
    console.log(
      `🔄 [convertRecipeQuantitiesOnUnitChange] Starting conversion for ingredient ${ingredientId}: ${oldUnit} → ${newUnit}`
    );

    const errors: string[] = [];
    let convertedCount = 0;
    let ingredientName = 'Unknown';
    const conversionResults: {
      recipeId: string;
      productName: string;
      oldQuantity: number;
      oldUnit: string;
      newQuantity: number;
      newUnit: string;
    }[] = [];

    try {
      // Buscar informações do ingrediente para auditoria
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
        select: { id: true, name: true, unit: true },
      });

      if (!ingredient) {
        const errorMsg = `Ingrediente ${ingredientId} não encontrado`;
        console.error('❌ [convertRecipeQuantitiesOnUnitChange]', errorMsg);
        errors.push(errorMsg);
        return { convertedRecipes: 0, errors };
      }

      ingredientName = ingredient.name;

      // Verificar se as unidades são compatíveis para conversão
      if (!areUnitsCompatible(oldUnit, newUnit)) {
        const errorMsg = `Unidades incompatíveis: não é possível converter de ${oldUnit} para ${newUnit}`;
        console.error('❌ [convertRecipeQuantitiesOnUnitChange]', errorMsg);
        errors.push(errorMsg);
        return { convertedRecipes: 0, errors };
      }

      // Buscar todas as receitas que usam este ingrediente
      const recipes = await prisma.recipe.findMany({
        where: { ingredientId },
        include: {
          product: {
            select: { id: true, name: true },
          },
          ingredient: {
            select: { id: true, name: true, unit: true },
          },
        },
      });

      if (recipes.length === 0) {
        return { convertedRecipes: 0, errors };
      }

      // Processar cada receita
      for (const recipe of recipes) {
        try {
          const currentQuantity = parseFloat(String(recipe.quantity));
          const currentUnit = recipe.unit;

          // Converter a quantidade da receita da unidade atual para a nova unidade do ingrediente
          let newQuantity: number;

          // Se a unidade da receita é igual à unidade antiga do ingrediente, fazer conversão direta
          if (
            currentUnit.toLowerCase().trim() === oldUnit.toLowerCase().trim()
          ) {
            const convertedQuantity = convertUnits(
              currentQuantity,
              oldUnit,
              newUnit
            );

            if (convertedQuantity === null) {
              const errorMsg = `Erro ao converter quantidade ${currentQuantity} de ${oldUnit} para ${newUnit} na receita do produto ${recipe.product?.name}`;
              console.error(
                '❌ [convertRecipeQuantitiesOnUnitChange]',
                errorMsg
              );
              errors.push(errorMsg);
              continue;
            }

            newQuantity = convertedQuantity;
            console.log(
              `   ✅ Direct conversion: ${currentQuantity} ${currentUnit} → ${newQuantity} ${newUnit}`
            );
          } else {
            // Se a unidade da receita é diferente da unidade antiga do ingrediente,
            // primeiro converter para a unidade antiga, depois para a nova
            const quantityInOldUnit = convertUnits(
              currentQuantity,
              currentUnit,
              oldUnit
            );

            if (quantityInOldUnit === null) {
              const errorMsg = `Erro ao converter ${currentQuantity} ${currentUnit} para ${oldUnit} na receita do produto ${recipe.product?.name}`;
              errors.push(errorMsg);
              continue;
            }

            const finalQuantity = convertUnits(
              quantityInOldUnit,
              oldUnit,
              newUnit
            );

            if (finalQuantity === null) {
              const errorMsg = `Erro ao converter ${quantityInOldUnit} ${oldUnit} para ${newUnit} na receita do produto ${recipe.product?.name}`;
              errors.push(errorMsg);
              continue;
            }

            newQuantity = finalQuantity;
          }

          // Atualizar a receita no banco de dados
          await prisma.recipe.update({
            where: { id: recipe.id },
            data: {
              quantity: newQuantity,
              unit: newUnit,
            },
          });

          convertedCount++;

          // Registrar conversão para auditoria
          conversionResults.push({
            recipeId: recipe.id,
            productName: recipe.product?.name || 'Unknown Product',
            oldQuantity: currentQuantity,
            oldUnit: currentUnit,
            newQuantity,
            newUnit,
          });

          // Log de auditoria
          console.log(
            `📝 [AUDIT] Recipe conversion - Product: ${recipe.product?.name}, Recipe ID: ${recipe.id}, Quantity: ${currentQuantity} ${currentUnit} → ${newQuantity} ${newUnit}, Reason: Ingredient unit change (${oldUnit} → ${newUnit})`
          );
        } catch (recipeError) {
          const errorMsg = `Erro ao processar receita ${recipe.id} (${recipe.product?.name}): ${recipeError}`;
          errors.push(errorMsg);
        }
      }

      // Registrar a operação de conversão
      logUnitConversion({
        timestamp: new Date().toISOString(),
        ingredientId,
        ingredientName: ingredient.name,
        oldUnit,
        newUnit,
        conversions: conversionResults,
        errors,
      });

      return { convertedRecipes: convertedCount, errors };
    } catch (error) {
      const errorMsg = `Erro geral na conversão de receitas: ${error}`;
      console.error('❌ [convertRecipeQuantitiesOnUnitChange]', errorMsg);
      errors.push(errorMsg);

      // Registrar a operação falhada
      logUnitConversion({
        timestamp: new Date().toISOString(),
        ingredientId,
        ingredientName,
        oldUnit,
        newUnit,
        conversions: [],
        errors: [...errors, errorMsg],
      });

      return { convertedRecipes: convertedCount, errors };
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

      for (const recipe of recipesUsingProduct) {
        if (processedProducts.has(recipe.productId)) {
          continue;
        }
        processedProducts.add(recipe.productId);

        // Para produtos dependentes, vamos calcular uma diferença estimada baseada no impacto
        const dependentProductIngredient = recipe.productIngredient;

        if (!dependentProductIngredient) {
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

        // Atualizar timestamp do produto dependente
        await this.updateProductTimestamp(recipe.productId);

        // Adicionar à próxima iteração para continuar a propagação
        nextLevelAffectedProducts.push(recipe.productId);
      }
    }

    // Continuar propagação recursivamente
    if (nextLevelAffectedProducts.length > 0) {
      await this.propagateCostChangeToProductDependencies(
        nextLevelAffectedProducts,
        processedProducts
      );
    }
  },
};

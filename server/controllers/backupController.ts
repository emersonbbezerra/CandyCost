import { Request, Response } from 'express';
import { prisma } from '../db';

export class BackupController {
  /**
   * Endpoint para restaurar backup completo
   * POST /api/restore-backup
   */
  async restoreBackup(req: Request, res: Response) {
    const { backupData } = req.body;

    try {
      // Validações básicas
      if (!backupData) {
        return res.status(400).json({
          error: 'Dados de backup não fornecidos',
        });
      }

      if (!backupData.application || backupData.application !== 'CandyCost') {
        return res.status(400).json({
          error: 'Arquivo de backup inválido - não é um backup do CandyCost',
        });
      }

      if (!backupData.data) {
        return res.status(400).json({
          error: 'Arquivo de backup corrompido - dados não encontrados',
        });
      }

      const {
        ingredients = [],
        products = [],
        priceHistory = [],
        fixedCosts = [],
        workConfiguration,
      } = backupData.data;

      // Executar restauração dentro de uma transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Limpar dados existentes (preservando usuários e sessões)
        await tx.priceHistory.deleteMany({});
        await tx.recipe.deleteMany({});
        await tx.product.deleteMany({});
        await tx.ingredient.deleteMany({});
        await tx.fixedCost.deleteMany({});

        // 2. Restaurar ingredientes
        const restoredIngredients = await Promise.all(
          ingredients.map(async (ingredient: any) => {
            const { id, createdAt, updatedAt, ...ingredientData } = ingredient;
            return tx.ingredient.create({
              data: {
                ...ingredientData,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
                updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
              },
            });
          })
        );

        // 3. Restaurar produtos
        const restoredProducts = await Promise.all(
          products.map(async (product: any) => {
            const { id, recipes, createdAt, updatedAt, ...productData } =
              product;
            return tx.product.create({
              data: {
                ...productData,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
                updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
              },
            });
          })
        );

        // 4. Criar mapeamento de IDs antigos para novos
        const ingredientIdMap = new Map();
        ingredients.forEach((old: any, index: number) => {
          ingredientIdMap.set(old.id, restoredIngredients[index].id);
        });

        const productIdMap = new Map();
        products.forEach((old: any, index: number) => {
          productIdMap.set(old.id, restoredProducts[index].id);
        });

        // 5. Restaurar receitas
        let recipeCount = 0;
        for (const product of products) {
          if (product.recipes && Array.isArray(product.recipes)) {
            for (const recipe of product.recipes) {
              const newProductId = productIdMap.get(product.id);

              const recipeData: any = {
                productId: newProductId,
                quantity: recipe.quantity,
                unit: recipe.unit,
              };

              // Mapear ingrediente ou produto usado na receita
              if (recipe.ingredientId) {
                const newIngredientId = ingredientIdMap.get(
                  recipe.ingredientId
                );
                if (newIngredientId) {
                  recipeData.ingredientId = newIngredientId;
                }
              }

              if (recipe.productIngredientId) {
                const newProductIngredientId = productIdMap.get(
                  recipe.productIngredientId
                );
                if (newProductIngredientId) {
                  recipeData.productIngredientId = newProductIngredientId;
                }
              }

              await tx.recipe.create({ data: recipeData });
              recipeCount++;
            }
          }
        }

        // 6. Restaurar custos fixos
        const restoredFixedCosts = await Promise.all(
          fixedCosts.map(async (fixedCost: any) => {
            const { id, createdAt, updatedAt, ...fixedCostData } = fixedCost;
            return tx.fixedCost.create({
              data: {
                ...fixedCostData,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
                updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
              },
            });
          })
        );

        // 7. Restaurar histórico de preços
        const restoredPriceHistory = await Promise.all(
          priceHistory.map(async (history: any) => {
            const { id, createdAt, ingredientId, productId, ...historyData } =
              history;

            const historyRecord: any = {
              ...historyData,
              createdAt: createdAt ? new Date(createdAt) : new Date(),
            };

            // Mapear IDs de ingredientes e produtos no histórico
            if (ingredientId) {
              const newIngredientId = ingredientIdMap.get(ingredientId);
              if (newIngredientId) {
                historyRecord.ingredientId = newIngredientId;
              }
            }

            if (productId) {
              const newProductId = productIdMap.get(productId);
              if (newProductId) {
                historyRecord.productId = newProductId;
              }
            }

            return tx.priceHistory.create({ data: historyRecord });
          })
        );

        // 8. Restaurar configuração de trabalho (se fornecida)
        if (workConfiguration) {
          // Buscar configuração existente
          const existingConfig = await tx.workConfiguration.findFirst();

          const { id, createdAt, updatedAt, ...configData } = workConfiguration;

          if (existingConfig) {
            // Atualizar configuração existente
            await tx.workConfiguration.update({
              where: { id: existingConfig.id },
              data: {
                ...configData,
                updatedAt: new Date(),
              },
            });
          } else {
            // Criar nova configuração
            await tx.workConfiguration.create({
              data: {
                ...configData,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
                updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
              },
            });
          }
        }

        return {
          ingredients: restoredIngredients.length,
          products: restoredProducts.length,
          recipes: recipeCount,
          fixedCosts: restoredFixedCosts.length,
          priceHistory: restoredPriceHistory.length,
          workConfiguration: workConfiguration ? 1 : 0,
        };
      });

      console.log('✅ Backup restaurado com sucesso:', result);

      res.json({
        message: 'Backup restaurado com sucesso',
        restored: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      res.status(500).json({
        error: 'Erro interno ao restaurar backup',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}

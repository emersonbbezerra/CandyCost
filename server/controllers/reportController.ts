import { Request, Response } from 'express';
import { reportService } from '../services/reportService';

export const getReports = async (_req: Request, res: Response) => {
  try {
    const ingredients = await reportService.getIngredients();
    const products = await reportService.getProducts();

    // Calculate product costs
    const costsPromises = products.map(async (product) => {
      try {
        const cost = await reportService.calculateProductCost(
          Number(product.id)
        );
        return { product, cost };
      } catch {
        return {
          product,
          cost: {
            productId: product.id,
            totalCost: 0,
            suggestedPrice: 0,
            margin: 0,
          },
        };
      }
    });

    const productCosts = await Promise.all(costsPromises);

    // Lucratividade analysis
    const profitabilityAnalysis = productCosts
      .map(({ product, cost }) => {
        const profitMargin =
          typeof (cost as any).suggestedPrice === 'number' &&
          (cost as any).suggestedPrice > 0
            ? (((cost as any).suggestedPrice - cost.totalCost) /
                (cost as any).suggestedPrice) *
              100
            : 0;
        return { product, cost, profitMargin };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin);

    // Critical ingredients analysis
    const ingredientUsage = new Map<string, number>();
    const recipesPromises = products.map(async (product) => {
      try {
        const recipes = await reportService.getRecipesByProduct(
          Number(product.id)
        );
        recipes.forEach((recipe) => {
          if (recipe.ingredientId) {
            ingredientUsage.set(
              recipe.ingredientId,
              (ingredientUsage.get(recipe.ingredientId) || 0) + 1
            );
          }
        });
      } catch {
        // Skip if no recipes found
      }
    });

    await Promise.all(recipesPromises);

    const criticalIngredients = ingredients
      .map((ingredient) => {
        const costPerUnit = ingredient.price / ingredient.quantity;
        const usageCount = ingredientUsage.get(ingredient.id) || 0;
        return {
          ingredient,
          usageCount,
          totalImpact: usageCount * costPerUnit,
        };
      })
      .filter((item) => item.usageCount > 0)
      .sort((a, b) => b.totalImpact - a.totalImpact);

    // Category distribution
    const categoryMap = new Map<string, { count: number; totalCost: number }>();
    productCosts.forEach(({ product, cost }) => {
      const current = categoryMap.get(product.category) || {
        count: 0,
        totalCost: 0,
      };
      categoryMap.set(product.category, {
        count: current.count + 1,
        totalCost: current.totalCost + cost.totalCost,
      });
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        avgCost: data.totalCost / data.count,
      })
    );

    // Complex recipes analysis
    const complexRecipesPromises = products.map(async (product) => {
      try {
        const recipes = await reportService.getRecipesByProduct(
          Number(product.id)
        );
        const hasProductIngredients = recipes.some(
          (recipe) => recipe.productIngredientId
        );
        return {
          product,
          hasProductIngredients,
          ingredientCount: recipes.length,
        };
      } catch {
        return {
          product,
          hasProductIngredients: false,
          ingredientCount: 0,
        };
      }
    });

    const complexRecipes = (await Promise.all(complexRecipesPromises)).filter(
      (item) => item.hasProductIngredients || item.ingredientCount > 5
    );

    res.json({
      profitabilityAnalysis,
      criticalIngredients,
      categoryDistribution,
      complexRecipes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatórios' });
  }
};

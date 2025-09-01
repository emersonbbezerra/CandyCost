import { Request, Response } from 'express';
import { priceHistoryService } from '../services/priceHistoryService';
import { productService } from '../services/productService';
import { recipeService } from '../services/recipeService';

export const saveRecipes = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const recipes = req.body; // Simplified validation

    console.log('[RecipeController] Saving recipes for product:', {
      productId,
      recipesCount: recipes.length,
    });

    // Calcular custo atual antes de alterar a receita
    const oldCost = await productService.calculateProductCost(productId);
    console.log('[RecipeController] Old product cost:', oldCost);

    // Delete existing recipes for this product
    await recipeService.deleteRecipesByProduct(productId);

    // Create new recipes with proper validation
    const createdRecipes = await Promise.all(
      recipes.map((recipe: any) =>
        recipeService.createRecipe({
          productId: String(productId),
          ingredientId: recipe.ingredientId || null,
          productIngredientId: recipe.productIngredientId || null,
          quantity: recipe.quantity,
          unit: recipe.unit || 'un',
        })
      )
    );

    console.log(
      '[RecipeController] Recipes saved, now recalculating product cost...'
    );

    // Recalcular custos do produto após atualizar receitas
    const newCost = await productService.calculateProductCost(productId);
    console.log('[RecipeController] New product cost:', newCost);

    // Registrar mudança no histórico de preços se houve alteração significativa
    const oldCostPerUnit = oldCost.costPerYieldUnit ?? 0;
    const newCostPerUnit = newCost.costPerYieldUnit ?? 0;
    const threshold = 0.0001; // Mudanças maiores que R$ 0,0001 (mais sensível)

    console.log(
      `[RecipeController] Cost comparison: ${oldCostPerUnit.toFixed(
        6
      )} -> ${newCostPerUnit.toFixed(6)}, diff: ${Math.abs(
        newCostPerUnit - oldCostPerUnit
      ).toFixed(6)}`
    );

    let costChanged = false;

    if (Math.abs(newCostPerUnit - oldCostPerUnit) > threshold) {
      console.log(
        '[RecipeController] Registering cost change in price history...'
      );

      await priceHistoryService.createPriceHistory({
        productId,
        itemType: 'product',
        itemName: newCost.productId, // Será buscado automaticamente pelo service
        oldPrice: oldCostPerUnit,
        newPrice: newCostPerUnit,
        changeReason: 'Atualização por receita modificada',
        changeType: 'recipe_update',
      });

      costChanged = true;
      console.log('[RecipeController] Price history recorded successfully');
    } else {
      console.log(
        '[RecipeController] Cost change too small, not recording in history'
      );
    }

    // 🚀 NOVA FUNCIONALIDADE: Se o custo do produto mudou e ele também é usado como ingrediente,
    // propagar as mudanças para outros produtos que o usam
    if (costChanged) {
      console.log(
        '[RecipeController] Product cost changed, checking if it affects other products...'
      );

      try {
        // Buscar informações do produto para ver se é também ingrediente
        const product = await productService.getProductById(productId);

        if (product?.isAlsoIngredient) {
          console.log(
            '[RecipeController] Product is also an ingredient, propagating changes...'
          );

          // Propagar mudanças para produtos que usam este produto como ingrediente
          const processedProducts = new Set<string>();
          processedProducts.add(productId); // Evitar recursão infinita

          await productService.propagateCostChangeToProductDependencies(
            [productId],
            processedProducts
          );

          console.log(
            '[RecipeController] Cost change propagation completed successfully'
          );
        } else {
          console.log(
            '[RecipeController] Product is not used as ingredient, no propagation needed'
          );
        }
      } catch (propagationError) {
        console.error(
          '[RecipeController] Error propagating cost changes:',
          propagationError
        );
        // Não falhar a resposta por causa do erro de propagação
      }
    }

    res.json(createdRecipes);
  } catch (error) {
    console.error('Erro ao salvar receitas:', error);
    res.status(500).json({ message: 'Erro ao salvar receitas' });
  }
};

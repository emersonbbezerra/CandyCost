import { Request, Response } from 'express';
import { recipeService } from '../services/recipeService';

export const saveRecipes = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const recipes = req.body; // Simplified validation

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

    res.json(createdRecipes);
  } catch (error) {
    console.error('Erro ao salvar receitas:', error);
    res.status(500).json({ message: 'Erro ao salvar receitas' });
  }
};

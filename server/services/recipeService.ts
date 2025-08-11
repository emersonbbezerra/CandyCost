import { prisma } from '../db';

export const recipeService = {
  async deleteRecipesByProduct(productId: string) {
    await prisma.recipe.deleteMany({
      where: { productId },
    });
  },

  async createRecipe(data: {
    productId: string;
    ingredientId: string | null;
    productIngredientId: string | null;
    quantity: string | number;
    unit: string;
  }) {
    const newRecipe = await prisma.recipe.create({
      data: {
        productId: data.productId,
        ingredientId: data.ingredientId,
        productIngredientId: data.productIngredientId,
        quantity:
          typeof data.quantity === 'string'
            ? parseFloat(data.quantity)
            : data.quantity,
        unit: data.unit,
      },
    });
    return newRecipe;
  },
};


import { prisma } from "../db";

export const recipeService = {
  async deleteRecipesByProduct(productId: string) {
    await prisma.recipe.deleteMany({
      where: { productId }
    });
  },

  async createRecipe(data: {
    productId: string;
    ingredientId: number | null;
    productIngredientId: string | null;
    quantity: string;
    unit: string;
  }) {
    const newRecipe = await prisma.recipe.create({
      data
    });
    return newRecipe;
  }
};

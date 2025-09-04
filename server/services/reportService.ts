import { prisma } from '../db';
import { productService } from './productService';

export const reportService = {
  async getIngredients() {
    return await prisma.ingredient.findMany();
  },

  async getProducts() {
    return await productService.getProducts();
  },

  // Usar IDs string para evitar problemas de NaN com Number(uuid)
  async getRecipesByProduct(productId: string) {
    const recipes = await prisma.recipe.findMany({
      where: { productId },
    });

    return recipes.map((recipe) => ({
      ...recipe,
      quantity: recipe.quantity.toString(),
    }));
  },

  async calculateProductCost(productId: string) {
    return await productService.calculateProductCost(productId);
  },
};

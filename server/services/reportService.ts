import { prisma } from '../db';
import { productService } from './productService';

export const reportService = {
  async getIngredients() {
    const ingredients = await prisma.ingredient.findMany();
    return ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: ingredient.quantity.toString(),
      price: ingredient.price.toString(),
    }));
  },

  async getProducts() {
    return await productService.getProducts();
  },

  async getRecipesByProduct(productId: number) {
    const recipes = await prisma.recipe.findMany({
      where: { productId: String(productId) },
    });

    return recipes.map((recipe) => ({
      ...recipe,
      quantity: recipe.quantity.toString(),
    }));
  },

  async calculateProductCost(productId: number) {
    return await productService.calculateProductCost(String(productId));
  },
};

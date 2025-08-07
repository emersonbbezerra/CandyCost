
import { prisma } from "../db";
import type { Recipe, InsertRecipe } from "@shared/schema";

export const recipeRepository = {
  async findByProductId(productId: number): Promise<Recipe[]> {
    const recipes = await prisma.recipe.findMany({
      where: { productId }
    });
    
    return recipes.map(recipe => ({
      ...recipe,
      quantity: recipe.quantity.toString(),
    }));
  },

  async findProductsUsingIngredient(ingredientId: number) {
    const recipes = await prisma.recipe.findMany({
      where: { ingredientId },
      include: {
        product: true
      }
    });
    
    return recipes.map(recipe => ({
      ...recipe,
      quantity: recipe.quantity.toString(),
      product: {
        ...recipe.product,
        marginPercentage: recipe.product.marginPercentage.toString(),
      }
    }));
  },

  async create(data: InsertRecipe): Promise<Recipe> {
    const recipe = await prisma.recipe.create({
      data: {
        ...data,
        quantity: parseFloat(data.quantity),
      }
    });
    
    return {
      ...recipe,
      quantity: recipe.quantity.toString(),
    };
  },

  async update(id: number, data: Partial<InsertRecipe>): Promise<Recipe> {
    const updateData: any = { ...data };
    
    if (data.quantity) {
      updateData.quantity = parseFloat(data.quantity);
    }
    
    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData
    });
    
    return {
      ...recipe,
      quantity: recipe.quantity.toString(),
    };
  },

  async delete(id: number): Promise<void> {
    await prisma.recipe.delete({
      where: { id }
    });
  },

  async deleteByProductId(productId: number): Promise<void> {
    await prisma.recipe.deleteMany({
      where: { productId }
    });
  }
};

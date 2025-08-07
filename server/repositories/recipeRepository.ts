
import { prisma } from "../db";
import type { Recipe, InsertRecipe } from "@shared/schema";

export const recipeRepository = {
  async findAll(): Promise<Recipe[]> {
    return await prisma.recipe.findMany();
  },

  async findById(id: string): Promise<Recipe | null> {
    return await prisma.recipe.findUnique({
      where: { id }
    });
  },

  async findByProductId(productId: string): Promise<Recipe[]> {
    return await prisma.recipe.findMany({
      where: { productId },
      include: {
        ingredient: true,
        productIngredient: true
      }
    });
  },

  async create(data: InsertRecipe): Promise<Recipe> {
    return await prisma.recipe.create({
      data
    });
  },

  async update(id: string, data: Partial<InsertRecipe>): Promise<Recipe> {
    return await prisma.recipe.update({
      where: { id },
      data
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.recipe.delete({
      where: { id }
    });
  },

  async deleteByProductId(productId: string): Promise<void> {
    await prisma.recipe.deleteMany({
      where: { productId }
    });
  },

  async findProductsUsingIngredient(ingredientId: string): Promise<string[]> {
    const recipes = await prisma.recipe.findMany({
      where: { ingredientId },
      select: { productId: true },
      distinct: ['productId']
    });
    
    return recipes.map(recipe => recipe.productId);
  },

  async findProductsUsingProductIngredient(productIngredientId: string): Promise<string[]> {
    const recipes = await prisma.recipe.findMany({
      where: { productIngredientId },
      select: { productId: true },
      distinct: ['productId']
    });
    
    return recipes.map(recipe => recipe.productId);
  }
};

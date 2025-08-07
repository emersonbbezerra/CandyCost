import { prisma } from "../db";
import type { Ingredient, InsertIngredient } from "@shared/schema";

export const ingredientRepository = {
  async findAll(): Promise<Ingredient[]> {
    return await prisma.ingredient.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string): Promise<Ingredient | null> {
    return await prisma.ingredient.findUnique({
      where: { id }
    });
  },

  async create(data: InsertIngredient): Promise<Ingredient> {
    return await prisma.ingredient.create({
      data
    });
  },

  async update(id: string, data: Partial<InsertIngredient>): Promise<Ingredient> {
    return await prisma.ingredient.update({
      where: { id },
      data
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.ingredient.delete({
      where: { id }
    });
  },

  async findByCategory(category: string): Promise<Ingredient[]> {
    return await prisma.ingredient.findMany({
      where: { category },
      orderBy: { name: 'asc' }
    });
  },

  async findByName(name: string): Promise<Ingredient | null> {
    return await prisma.ingredient.findFirst({
      where: { name }
    });
  },

  async getCategories(): Promise<string[]> {
    const result = await prisma.ingredient.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    return result.map(item => item.category);
  }
};
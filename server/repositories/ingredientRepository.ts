
import { prisma } from "../db";
import type { Ingredient, InsertIngredient } from "@shared/schema";

export const ingredientRepository = {
  async findAll(): Promise<Ingredient[]> {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    });
    
    return ingredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity.toString(),
      price: ingredient.price.toString(),
    }));
  },

  async findById(id: number): Promise<Ingredient | null> {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id }
    });
    
    if (!ingredient) return null;
    
    return {
      ...ingredient,
      quantity: ingredient.quantity.toString(),
      price: ingredient.price.toString(),
    };
  },

  async create(data: InsertIngredient): Promise<Ingredient> {
    const ingredient = await prisma.ingredient.create({
      data: {
        ...data,
        quantity: parseFloat(data.quantity),
        price: parseFloat(data.price),
      }
    });
    
    return {
      ...ingredient,
      quantity: ingredient.quantity.toString(),
      price: ingredient.price.toString(),
    };
  },

  async update(id: number, data: Partial<InsertIngredient>): Promise<Ingredient> {
    const updateData: any = { ...data };
    
    if (data.quantity) {
      updateData.quantity = parseFloat(data.quantity);
    }
    if (data.price) {
      updateData.price = parseFloat(data.price);
    }
    
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: updateData
    });
    
    return {
      ...ingredient,
      quantity: ingredient.quantity.toString(),
      price: ingredient.price.toString(),
    };
  },

  async delete(id: number): Promise<void> {
    await prisma.ingredient.delete({
      where: { id }
    });
  }
};

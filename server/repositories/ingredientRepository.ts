import { ingredients } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export const ingredientRepository = {
  async getIngredients() {
    return await db.select().from(ingredients).execute();
  },

  async getIngredient(id: number) {
    const result = await db.select().from(ingredients).where(eq(ingredients.id, id)).limit(1).execute();
    return result[0] || null;
  },

  async createIngredient(data: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    price: string;
    brand?: string | null;
  }) {
    const [newIngredient] = await db.insert(ingredients).values(data).returning();
    return newIngredient;
  },

  async updateIngredient(id: number, data: Partial<{
    name: string;
    category: string;
    quantity: string;
    unit: string;
    price: string;
    brand?: string | null;
  }>) {
    const [updatedIngredient] = await db.update(ingredients).set(data).where(eq(ingredients.id, id)).returning();
    return updatedIngredient;
  },

  async deleteIngredient(id: number) {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }
};

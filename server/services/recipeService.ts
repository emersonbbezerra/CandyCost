import { recipes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export const recipeService = {
  async deleteRecipesByProduct(productId: number) {
    await db.delete(recipes).where(eq(recipes.productId, productId));
  },

  async createRecipe(data: {
    productId: number;
    ingredientId: number | null;
    productIngredientId: number | null;
    quantity: string;
    unit: string;
  }) {
    const [newRecipe] = await db.insert(recipes).values(data).returning();
    return newRecipe;
  }
};

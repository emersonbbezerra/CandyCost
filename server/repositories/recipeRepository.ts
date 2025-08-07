import { ingredients, recipes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

// Define a interface Recipe for type safety
interface Recipe {
  id: number;
  productId: number;
  ingredientId: number | null;
  productIngredientId: number | null;
  quantity: string;
  unit: string;
}

export const recipeRepository = {
  async getRecipesByProduct(productId: number) {
    return await db.select().from(recipes).where(eq(recipes.productId, productId)).execute();
  },

  async getProductRecipesWithIngredients(productId: number) {
    return await db
      .select({
        id: recipes.id,
        productId: recipes.productId,
        ingredientId: recipes.ingredientId,
        productIngredientId: recipes.productIngredientId,
        quantity: recipes.quantity,
        unit: recipes.unit,
        ingredient: {
          id: ingredients.id,
          name: ingredients.name,
          category: ingredients.category,
          quantity: ingredients.quantity,
          unit: ingredients.unit,
          price: ingredients.price,
          brand: ingredients.brand,
        },
      })
      .from(recipes)
      .leftJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
      .where(eq(recipes.productId, productId))
      .execute();
  },

  async createRecipe(data: {
    productId: number;
    ingredientId?: number | null;
    productIngredientId?: number | null;
    quantity: string;
    unit: string;
  }) {
    const [newRecipe] = await db.insert(recipes).values(data).returning();
    return newRecipe;
  },

  async updateRecipe(id: number, data: Partial<{
    productId: number;
    ingredientId?: number | null;
    productIngredientId?: number | null;
    quantity: string;
    unit: string;
  }>) {
    const [updatedRecipe] = await db.update(recipes).set(data).where(eq(recipes.id, id)).returning();
    return updatedRecipe;
  },

  async deleteRecipe(id: number) {
    await db.delete(recipes).where(eq(recipes.id, id));
  },

  async deleteRecipesByProduct(productId: number) {
    await db.delete(recipes).where(eq(recipes.productId, productId));
  },

  async deleteRecipesByIngredient(ingredientId: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.ingredientId, ingredientId));
  },

  async getRecipesByProductId(productId: number): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.productId, productId));
  },
};
import { ingredients, recipes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { productService } from "./productService";

export const reportService = {
  async getIngredients() {
    return await db.select().from(ingredients).execute();
  },

  async getProducts() {
    return await productService.getProducts();
  },

  async getRecipesByProduct(productId: number) {
    return await db.select().from(recipes).where(eq(recipes.productId, productId)).execute();
  },

  async calculateProductCost(productId: number) {
    return await productService.calculateProductCost(productId);
  }
};

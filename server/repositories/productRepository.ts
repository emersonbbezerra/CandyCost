import { products } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export const productRepository = {
  async getProducts() {
    return await db.select().from(products).execute();
  },

  async getProduct(id: number) {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1).execute();
    return result[0] || null;
  },

  async createProduct(data: {
    name: string;
    category: string;
    description?: string;
    isAlsoIngredient?: boolean;
    marginPercentage?: string;
  }) {
    const [newProduct] = await db.insert(products).values(data).returning();
    return newProduct;
  },

  async updateProduct(id: number, data: Partial<{
    name: string;
    category: string;
    description?: string;
    isAlsoIngredient?: boolean;
    marginPercentage?: string;
  }>) {
    const [updatedProduct] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return updatedProduct;
  },

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }
};

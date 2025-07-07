import { priceHistory } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { db } from "../db";

export const priceHistoryRepository = {
  async getPriceHistory(ingredientId?: number, productId?: number) {
    const conditions = [];

    if (ingredientId !== undefined) {
      conditions.push(eq(priceHistory.ingredientId, ingredientId));
    }

    if (productId !== undefined) {
      conditions.push(eq(priceHistory.productId, productId));
    }

    const query = conditions.length > 0
      ? db.select().from(priceHistory).where(and(...conditions))
      : db.select().from(priceHistory);

    const result = await query;
    if (Array.isArray(result)) {
      return result;
    } else {
      return [];
    }
  },

  async createPriceHistory(data: {
    ingredientId?: number;
    productId?: number;
    oldPrice: string;
    newPrice: string;
    changeReason?: string | null;
    createdAt?: Date;
  }) {
    const [newPriceHistory] = await db.insert(priceHistory).values(data).returning();
    return newPriceHistory;
  }
};

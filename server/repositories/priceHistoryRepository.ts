
import { prisma } from "../db";
import type { PriceHistory, InsertPriceHistory } from "@shared/schema";

export const priceHistoryRepository = {
  async findRecent(limit: number = 50): Promise<PriceHistory[]> {
    const priceHistories = await prisma.priceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return priceHistories.map(history => ({
      ...history,
      oldPrice: history.oldPrice.toString(),
      newPrice: history.newPrice.toString(),
    }));
  },

  async findByIngredientId(ingredientId: number): Promise<PriceHistory[]> {
    const priceHistories = await prisma.priceHistory.findMany({
      where: { ingredientId },
      orderBy: { createdAt: 'desc' }
    });
    
    return priceHistories.map(history => ({
      ...history,
      oldPrice: history.oldPrice.toString(),
      newPrice: history.newPrice.toString(),
    }));
  },

  async findByProductId(productId: number): Promise<PriceHistory[]> {
    const priceHistories = await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    
    return priceHistories.map(history => ({
      ...history,
      oldPrice: history.oldPrice.toString(),
      newPrice: history.newPrice.toString(),
    }));
  },

  async create(data: InsertPriceHistory): Promise<PriceHistory> {
    const priceHistory = await prisma.priceHistory.create({
      data: {
        ...data,
        oldPrice: parseFloat(data.oldPrice),
        newPrice: parseFloat(data.newPrice),
      }
    });
    
    return {
      ...priceHistory,
      oldPrice: priceHistory.oldPrice.toString(),
      newPrice: priceHistory.newPrice.toString(),
    };
  }
};

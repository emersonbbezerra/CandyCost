
import { prisma } from "../db";
import type { PriceHistory, InsertPriceHistory } from "@shared/schema";

export const priceHistoryRepository = {
  async findAll(): Promise<PriceHistory[]> {
    return await prisma.priceHistory.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string): Promise<PriceHistory | null> {
    return await prisma.priceHistory.findUnique({
      where: { id }
    });
  },

  async create(data: InsertPriceHistory): Promise<PriceHistory> {
    return await prisma.priceHistory.create({
      data
    });
  },

  async findRecent(limit: number = 20): Promise<PriceHistory[]> {
    return await prisma.priceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  async findByItemType(itemType: string): Promise<PriceHistory[]> {
    return await prisma.priceHistory.findMany({
      where: { itemType },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findByIngredientId(ingredientId: string): Promise<PriceHistory[]> {
    return await prisma.priceHistory.findMany({
      where: { ingredientId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findByProductId(productId: string): Promise<PriceHistory[]> {
    return await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findByDateRange(startDate: Date, endDate: Date): Promise<PriceHistory[]> {
    return await prisma.priceHistory.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};

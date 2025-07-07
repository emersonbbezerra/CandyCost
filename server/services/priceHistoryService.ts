import { priceHistoryRepository } from "../repositories/priceHistoryRepository";

export const priceHistoryService = {
  async getPriceHistory(ingredientId?: number, productId?: number) {
    return await priceHistoryRepository.getPriceHistory(ingredientId, productId);
  },

  async createPriceHistory(data: {
    ingredientId?: number;
    productId?: number;
    oldPrice: string;
    newPrice: string;
    changeReason?: string | null;
    createdAt?: Date;
  }) {
    return await priceHistoryRepository.createPriceHistory(data);
  }
};

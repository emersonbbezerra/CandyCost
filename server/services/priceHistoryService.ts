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
    console.log("Creating price history:", {
      ingredientId: data.ingredientId,
      productId: data.productId,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      changeReason: data.changeReason,
      createdAt: data.createdAt
    });

    const result = await priceHistoryRepository.createPriceHistory(data);
    console.log("Price history created with ID:", result?.id);
    return result;
  },
};
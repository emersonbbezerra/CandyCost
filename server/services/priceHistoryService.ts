import { priceHistoryRepository } from "../repositories/priceHistoryRepository";

export const priceHistoryService = {
  async getPriceHistory(ingredientId?: string, productId?: string) {
    return await priceHistoryRepository.findAll();
  },

  async createPriceHistory(data: {
    ingredientId?: string;
    productId?: string;
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

    const result = await priceHistoryRepository.create({
      ingredientId: data.ingredientId || null,
      productId: data.productId || null,
      oldPrice: parseFloat(data.oldPrice),
      newPrice: parseFloat(data.newPrice),
      changeReason: data.changeReason || null,
      itemType: data.ingredientId ? 'ingredient' : 'product'
    });
    console.log("Price history created with ID:", result?.id);
    return result;
  },
};
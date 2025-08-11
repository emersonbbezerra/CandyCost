import { prisma } from '../db';
import { priceHistoryRepository } from '../repositories/priceHistoryRepository';

export const priceHistoryService = {
  async getPriceHistory(ingredientId?: string, productId?: string) {
    return await priceHistoryRepository.findAll();
  },

  async createPriceHistory(data: {
    ingredientId?: string;
    productId?: string;
    oldPrice: number;
    newPrice: number;
    changeReason?: string | null;
    createdAt?: Date;
    itemType?: string;
    itemName?: string;
    changeType?: string;
  }) {
    console.log('Creating price history:', {
      ingredientId: data.ingredientId,
      productId: data.productId,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      changeReason: data.changeReason,
      createdAt: data.createdAt,
    });

    let itemName = data.itemName ?? '';
    // Se for histórico de ingrediente e não foi passado itemName, buscar nome do ingrediente
    if (!itemName && data.ingredientId) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: data.ingredientId },
      });
      itemName = ingredient?.name ?? '';
    }
    // Se for histórico de produto e não foi passado itemName, buscar nome do produto
    if (!itemName && data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });
      itemName = product?.name ?? '';
    }
    const result = await priceHistoryRepository.create({
      ingredientId: data.ingredientId ?? undefined,
      productId: data.productId ?? undefined,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      description: data.changeReason ?? undefined,
      itemType: data.itemType ?? (data.ingredientId ? 'ingredient' : 'product'),
      itemName,
      changeType: data.changeType ?? 'manual',
    });
    console.log('Price history created with ID:', result?.id);
    return result;
  },
};

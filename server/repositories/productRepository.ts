import type { InsertProduct, Product } from '@shared/schema';
import { prisma } from '../db';

export const productRepository = {
  async findAll(): Promise<Product[]> {
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id },
    });
  },

  async create(data: InsertProduct): Promise<Product> {
    // Garantir que os campos obrigatórios estejam presentes
    return await prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        isAlsoIngredient: data.isAlsoIngredient,
        marginPercentage: data.marginPercentage,
        preparationTimeMinutes: data.preparationTimeMinutes,
        salePrice: data.salePrice,
        yield: data.yield,
        yieldUnit: data.yieldUnit,
      },
    });
  },

  async update(id: string, data: Partial<InsertProduct>): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  },

  async findByCategory(category: string): Promise<Product[]> {
    return await prisma.product.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  },

  async findByName(name: string): Promise<Product | null> {
    return await prisma.product.findFirst({
      where: { name },
    });
  },

  async findProductIngredients(): Promise<Product[]> {
    return await prisma.product.findMany({
      where: { isAlsoIngredient: true },
      orderBy: { name: 'asc' },
    });
  },

  async findWithRecipes(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            ingredient: true,
            productIngredient: true,
          },
        },
      },
    });
  },

  async getCategories(): Promise<string[]> {
    const result = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return result.map((item) => item.category);
  },
};

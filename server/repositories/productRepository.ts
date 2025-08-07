import { prisma } from "../db";
import type { Product, InsertProduct } from "@shared/schema";

export const productRepository = {
  async findAll(): Promise<Product[]> {
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id }
    });
  },

  async create(data: InsertProduct): Promise<Product> {
    return await prisma.product.create({
      data
    });
  },

  async update(id: string, data: Partial<InsertProduct>): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id }
    });
  },

  async findByCategory(category: string): Promise<Product[]> {
    return await prisma.product.findMany({
      where: { category },
      orderBy: { name: 'asc' }
    });
  },

  async findByName(name: string): Promise<Product | null> {
    return await prisma.product.findFirst({
      where: { name }
    });
  },

  async findProductIngredients(): Promise<Product[]> {
    return await prisma.product.findMany({
      where: { isAlsoIngredient: true },
      orderBy: { name: 'asc' }
    });
  },

  async getCategories(): Promise<string[]> {
    const result = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    return result.map(item => item.category);
  }
};
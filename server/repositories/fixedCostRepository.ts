import { prisma } from "../db";
import type { FixedCost, InsertFixedCost } from "@shared/schema";

export const fixedCostRepository = {
  async findAll(): Promise<FixedCost[]> {
    return await prisma.fixedCost.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string): Promise<FixedCost | null> {
    return await prisma.fixedCost.findUnique({
      where: { id }
    });
  },

  async create(data: InsertFixedCost): Promise<FixedCost> {
    return await prisma.fixedCost.create({
      data
    });
  },

  async update(id: string, data: Partial<InsertFixedCost>): Promise<FixedCost> {
    return await prisma.fixedCost.update({
      where: { id },
      data
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.fixedCost.delete({
      where: { id }
    });
  },

  async findActive(): Promise<FixedCost[]> {
    return await prisma.fixedCost.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  async findByCategory(category: string): Promise<FixedCost[]> {
    return await prisma.fixedCost.findMany({
      where: { category },
      orderBy: { name: 'asc' }
    });
  },

  async getCategories(): Promise<string[]> {
    const result = await prisma.fixedCost.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    return result.map(item => item.category);
  }
};
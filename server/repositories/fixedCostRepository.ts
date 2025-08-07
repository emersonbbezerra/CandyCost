
import { prisma } from "../db";
import type { FixedCost, InsertFixedCost } from "@shared/schema";

export const fixedCostRepository = {
  async findAll(): Promise<FixedCost[]> {
    const fixedCosts = await prisma.fixedCost.findMany({
      orderBy: { name: 'asc' }
    });
    
    return fixedCosts.map(cost => ({
      ...cost,
      value: cost.value.toString(),
    }));
  },

  async findById(id: number): Promise<FixedCost | null> {
    const fixedCost = await prisma.fixedCost.findUnique({
      where: { id }
    });
    
    if (!fixedCost) return null;
    
    return {
      ...fixedCost,
      value: fixedCost.value.toString(),
    };
  },

  async findActive(): Promise<FixedCost[]> {
    const fixedCosts = await prisma.fixedCost.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    return fixedCosts.map(cost => ({
      ...cost,
      value: cost.value.toString(),
    }));
  },

  async create(data: InsertFixedCost): Promise<FixedCost> {
    const fixedCost = await prisma.fixedCost.create({
      data: {
        ...data,
        value: parseFloat(data.value),
      }
    });
    
    return {
      ...fixedCost,
      value: fixedCost.value.toString(),
    };
  },

  async update(id: number, data: Partial<InsertFixedCost>): Promise<FixedCost> {
    const updateData: any = { ...data };
    
    if (data.value) {
      updateData.value = parseFloat(data.value);
    }
    
    const fixedCost = await prisma.fixedCost.update({
      where: { id },
      data: updateData
    });
    
    return {
      ...fixedCost,
      value: fixedCost.value.toString(),
    };
  },

  async delete(id: number): Promise<void> {
    await prisma.fixedCost.delete({
      where: { id }
    });
  }
};

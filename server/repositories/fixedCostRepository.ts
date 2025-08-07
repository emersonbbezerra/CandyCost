
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { fixedCosts, type FixedCost, type InsertFixedCost } from "../../shared/schema";

export class FixedCostRepository {
  async findAll(): Promise<FixedCost[]> {
    return await db.select().from(fixedCosts).orderBy(fixedCosts.category, fixedCosts.name);
  }

  async findActive(): Promise<FixedCost[]> {
    return await db.select().from(fixedCosts)
      .where(eq(fixedCosts.isActive, true))
      .orderBy(fixedCosts.category, fixedCosts.name);
  }

  async findById(id: number): Promise<FixedCost | null> {
    const result = await db.select().from(fixedCosts).where(eq(fixedCosts.id, id));
    return result[0] || null;
  }

  async create(data: InsertFixedCost): Promise<FixedCost> {
    const result = await db.insert(fixedCosts).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async update(id: number, data: Partial<InsertFixedCost>): Promise<FixedCost | null> {
    const result = await db.update(fixedCosts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(fixedCosts.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(fixedCosts).where(eq(fixedCosts.id, id));
    return result.rowCount > 0;
  }

  async toggleActive(id: number, isActive: boolean): Promise<FixedCost | null> {
    const result = await db.update(fixedCosts)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(fixedCosts.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: number): Promise<FixedCost | null> {
    const result = await db.delete(fixedCosts)
      .where(eq(fixedCosts.id, id))
      .returning();
    return result[0] || null;
  }
}


import { FixedCostRepository } from "../repositories/fixedCostRepository";
import { productRepository } from "../repositories/productRepository";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { workConfiguration } from "../../shared/schema";
import type { FixedCost, WorkConfiguration } from "../../shared/schema";

export class FixedCostService {
  private fixedCostRepository = new FixedCostRepository();
  private productRepository = productRepository;

  async getAllFixedCosts(): Promise<FixedCost[]> {
    return await this.fixedCostRepository.findAll();
  }

  async getActiveFixedCosts(): Promise<FixedCost[]> {
    return await this.fixedCostRepository.findActive();
  }

  async calculateMonthlyFixedCosts(): Promise<number> {
    const activeCosts = await this.getActiveFixedCosts();
    
    return activeCosts.reduce((total, cost) => {
      const value = parseFloat(cost.value);
      
      switch (cost.recurrence) {
        case "monthly":
          return total + value;
        case "quarterly":
          return total + (value / 3);
        case "yearly":
          return total + (value / 12);
        default:
          return total;
      }
    }, 0);
  }

  async calculateFixedCostPerUnit(estimatedMonthlyProduction: number): Promise<number> {
    const monthlyFixedCosts = await this.calculateMonthlyFixedCosts();
    
    if (estimatedMonthlyProduction <= 0) {
      return 0;
    }
    
    return monthlyFixedCosts / estimatedMonthlyProduction;
  }

  async getWorkConfiguration(): Promise<WorkConfiguration> {
    const result = await db.select().from(workConfiguration).limit(1);
    
    if (result.length === 0) {
      // Create default configuration if none exists
      const [defaultConfig] = await db.insert(workConfiguration).values({
        workDaysPerWeek: 5,
        hoursPerDay: "8.00",
        weeksPerMonth: "4.0",
      }).returning();
      return defaultConfig;
    }
    
    return result[0];
  }

  async updateWorkConfiguration(data: Partial<WorkConfiguration>): Promise<WorkConfiguration> {
    const config = await this.getWorkConfiguration();
    
    const [updated] = await db.update(workConfiguration)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workConfiguration.id, config.id))
      .returning();
    
    return updated;
  }

  async calculateFixedCostPerHour(): Promise<number> {
    const monthlyFixedCosts = await this.calculateMonthlyFixedCosts();
    const workConfig = await this.getWorkConfiguration();
    
    const workDays = workConfig.workDaysPerWeek;
    const hoursPerDay = parseFloat(workConfig.hoursPerDay);
    const weeksPerMonth = parseFloat(workConfig.weeksPerMonth);
    
    const totalHoursPerMonth = workDays * hoursPerDay * weeksPerMonth;
    
    if (totalHoursPerMonth <= 0) {
      return 0;
    }
    
    return monthlyFixedCosts / totalHoursPerMonth;
  }

  async calculateProductFixedCost(preparationTimeMinutes: number): Promise<number> {
    const fixedCostPerHour = await this.calculateFixedCostPerHour();
    const preparationTimeHours = preparationTimeMinutes / 60;
    
    return fixedCostPerHour * preparationTimeHours;
  }

  async getFixedCostsByCategory(): Promise<Record<string, { total: number; costs: FixedCost[] }>> {
    const activeCosts = await this.getActiveFixedCosts();
    const categorized: Record<string, { total: number; costs: FixedCost[] }> = {};

    activeCosts.forEach(cost => {
      const value = parseFloat(cost.value);
      let monthlyValue = 0;

      switch (cost.recurrence) {
        case "monthly":
          monthlyValue = value;
          break;
        case "quarterly":
          monthlyValue = value / 3;
          break;
        case "yearly":
          monthlyValue = value / 12;
          break;
      }

      if (!categorized[cost.category]) {
        categorized[cost.category] = { total: 0, costs: [] };
      }

      categorized[cost.category].total += monthlyValue;
      categorized[cost.category].costs.push(cost);
    });

    return categorized;
  }
}

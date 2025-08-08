import { fixedCostRepository } from "../repositories/fixedCostRepository";
import { productRepository } from "../repositories/productRepository";
import { prisma } from "../db";
import type { FixedCost, WorkConfiguration } from "../../shared/schema";

export class FixedCostService {
  private fixedCostRepository = fixedCostRepository;
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
    const result = await prisma.workConfiguration.findFirst();

    if (!result) {
      // Create default configuration if none exists
      const defaultConfig = await prisma.workConfiguration.create({
        data: {
          workDaysPerWeek: 5,
          hoursPerDay: "8.00",
          weeksPerMonth: "4.0",
        }
      });
      return defaultConfig;
    }

    return result;
  }

  async updateWorkConfiguration(data: Partial<WorkConfiguration>): Promise<WorkConfiguration> {
    const config = await this.getWorkConfiguration();

    // Remove all timestamp and ID fields to avoid conflicts
    const { id, createdAt, updatedAt, ...cleanData } = data as any;

    const updated = await prisma.workConfiguration.update({
      where: { id: config.id },
      data: {
        ...cleanData,
        updatedAt: new Date(),
      }
    });

    return updated;
  }

  async calculateFixedCostPerHour(): Promise<number> {
    const workConfig = await this.getWorkConfiguration();
    const monthlyFixedCosts = await this.calculateMonthlyFixedCosts();

    const daysPerMonth = workConfig.daysPerMonth || 22.0;
    const hoursPerDay = workConfig.hoursPerDay || 8.0;

    const totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;

    return monthlyFixedCosts / totalWorkHoursPerMonth;
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

  async deleteFixedCost(id: string): Promise<boolean> {
    try {
      await this.fixedCostRepository.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }
}
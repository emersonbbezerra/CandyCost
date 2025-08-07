
import { FixedCostRepository } from "../repositories/fixedCostRepository";
import { productRepository } from "../repositories/productRepository";
import type { FixedCost } from "../../shared/schema";

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

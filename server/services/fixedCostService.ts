import type { FixedCost, WorkConfiguration } from '../../shared/schema';
import { prisma } from '../db';
import { fixedCostRepository } from '../repositories/fixedCostRepository';
import { productRepository } from '../repositories/productRepository';
import {
  calculateWorkingDays,
  validateWorkingDaysConfig,
  type WorkingDaysConfig,
} from '../utils/workingDaysCalculator';
import { priceHistoryService } from './priceHistoryService';

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
      const value = parseFloat(String(cost.value));

      switch (cost.recurrence) {
        case 'monthly':
          return total + value;
        case 'quarterly':
          return total + value / 3;
        case 'yearly':
          return total + value / 12;
        default:
          return total;
      }
    }, 0);
  }

  async calculateFixedCostPerUnit(
    estimatedMonthlyProduction: number
  ): Promise<number> {
    const monthlyFixedCosts = await this.calculateMonthlyFixedCosts();

    if (estimatedMonthlyProduction <= 0) {
      return 0;
    }

    return monthlyFixedCosts / estimatedMonthlyProduction;
  }

  async getWorkConfiguration(): Promise<WorkConfiguration> {
    const result = await prisma.workConfiguration.findFirst();

    if (!result) {
      // Criar configuração padrão se não existir
      const defaultConfig = await prisma.workConfiguration.create({
        data: {
          hoursPerDay: 8.0,
          daysPerMonth: 22.0,
          hourlyRate: 25.0,
          highCostAlertThreshold: 50.0,
          currencySymbol: 'R$',
          enableCostAlerts: true,
          enablePriceAlerts: true,
          defaultMarginPercentage: 60.0,
          priceIncreaseAlertThreshold: 20.0,
          autoCalculateMargins: true,
          businessName: 'Minha Confeitaria',
          // Configuração padrão: seg-sex (5 dias por semana)
          workMonday: true,
          workTuesday: true,
          workWednesday: true,
          workThursday: true,
          workFriday: true,
          workSaturday: false,
          workSunday: false,
          // Calcular campos derivados
          annualWorkingDays: 261, // Aproximadamente 261 dias úteis seg-sex
          annualWorkingHours: 2088.0, // 261 * 8h
          monthlyWorkingHours: 174.0, // 2088 / 12
        },
      });
      return defaultConfig;
    }

    return result;
  }

  async updateWorkConfiguration(
    data: Partial<WorkConfiguration>
  ): Promise<WorkConfiguration> {
    const oldConfig = await this.getWorkConfiguration();
    const oldCostPerHour = await this.calculateFixedCostPerHour();

    // Remover todos os campos de timestamp e ID para evitar conflitos
    const {
      id,
      createdAt,
      updatedAt,
      annualWorkingDays,
      annualWorkingHours,
      monthlyWorkingHours,
      ...cleanData
    } = data as any;

    const updated = await prisma.workConfiguration.update({
      where: { id: oldConfig.id },
      data: {
        ...cleanData,
        updatedAt: new Date(),
      },
    });

    // Se algum campo de dias da semana ou horas por dia foi alterado, recalcular campos derivados
    const hasWorkingDaysFields = Boolean(
      data.workMonday !== undefined ||
        data.workTuesday !== undefined ||
        data.workWednesday !== undefined ||
        data.workThursday !== undefined ||
        data.workFriday !== undefined ||
        data.workSaturday !== undefined ||
        data.workSunday !== undefined ||
        data.hoursPerDay !== undefined
    );

    let finalConfig = updated;

    if (hasWorkingDaysFields) {
      await this.updateCalculatedFields(updated);
      // Buscar a configuração atualizada com os campos calculados
      finalConfig = await this.getWorkConfiguration();

      // Calcular novo custo por hora
      const newCostPerHour = await this.calculateFixedCostPerHour();

      // Se o custo por hora mudou, registrar no histórico e rastrear produtos afetados
      if (Math.abs(oldCostPerHour - newCostPerHour) > 0.01) {
        console.log(
          '🔄 Work configuration change affects costs, registering in history...'
        );

        // Registrar histórico da mudança na configuração de trabalho
        await priceHistoryService.createPriceHistory({
          itemType: 'work_config',
          itemName: 'Configuração de Trabalho',
          oldPrice: oldCostPerHour,
          newPrice: newCostPerHour,
          changeType: 'work_config_update',
          changeReason: 'Alteração na configuração de dias/horas de trabalho',
        });

        // Registrar histórico para todos os produtos ativos (pois todos são afetados)
        const products = await this.productRepository.findAll();

        for (const product of products) {
          try {
            // Calcular custo antigo e novo do produto baseado na mudança do custo por hora
            // Vamos assumir que o tempo de preparo do produto é usado para calcular o impacto
            const preparationTimeHours =
              (product.preparationTimeMinutes || 0) / 60;
            const oldProductCost = preparationTimeHours * oldCostPerHour;
            const newProductCost = preparationTimeHours * newCostPerHour;

            // Criar histórico indicando que o produto foi afetado pela mudança na configuração
            await priceHistoryService.createPriceHistory({
              productId: product.id,
              itemType: 'product',
              itemName: product.name,
              oldPrice: oldProductCost,
              newPrice: newProductCost,
              changeType: 'work_config_impact',
              changeReason: `Produto afetado por alteração na configuração de trabalho (custo por hora: ${oldCostPerHour.toFixed(
                4
              )} → ${newCostPerHour.toFixed(4)})`,
            });
          } catch (error) {
            console.error(
              `Error creating price history for product ${product.id}:`,
              error
            );
          }
        }
      }
    }

    return finalConfig;
  }

  async calculateFixedCostPerHour(): Promise<number> {
    const workConfig = await this.getWorkConfiguration();
    const monthlyFixedCosts = await this.calculateMonthlyFixedCosts();

    // Usar nova lógica se os campos de dias da semana estiverem definidos
    const hasNewConfiguration = workConfig.workMonday !== undefined;

    let totalWorkHoursPerMonth: number;

    if (hasNewConfiguration) {
      // Nova lógica: usar campos calculados
      totalWorkHoursPerMonth = workConfig.monthlyWorkingHours;
    } else {
      // Lógica antiga (compatibilidade)
      const daysPerMonth = workConfig.daysPerMonth || 22.0;
      const hoursPerDay = workConfig.hoursPerDay || 8.0;
      totalWorkHoursPerMonth = daysPerMonth * hoursPerDay;
    }

    if (totalWorkHoursPerMonth <= 0) {
      return 0;
    }

    return monthlyFixedCosts / totalWorkHoursPerMonth;
  }

  /**
   * Atualiza os campos calculados baseado na configuração de dias da semana
   */
  private async updateCalculatedFields(
    config: WorkConfiguration
  ): Promise<void> {
    const workingDaysConfig: WorkingDaysConfig = {
      workMonday: config.workMonday || false,
      workTuesday: config.workTuesday || false,
      workWednesday: config.workWednesday || false,
      workThursday: config.workThursday || false,
      workFriday: config.workFriday || false,
      workSaturday: config.workSaturday || false,
      workSunday: config.workSunday || false,
      hoursPerDay: config.hoursPerDay || 8.0,
    };

    // Validar se pelo menos um dia está selecionado
    if (!validateWorkingDaysConfig(workingDaysConfig)) {
      throw new Error(
        'Pelo menos um dia da semana deve ser selecionado como dia de trabalho'
      );
    }

    const calculations = calculateWorkingDays(workingDaysConfig);

    // Atualizar os campos calculados no banco
    await prisma.workConfiguration.update({
      where: { id: config.id },
      data: {
        annualWorkingDays: calculations.annualWorkingDays,
        annualWorkingHours: calculations.annualWorkingHours,
        monthlyWorkingHours: calculations.monthlyWorkingHours,
        updatedAt: new Date(),
      },
    });
  }

  async calculateProductFixedCost(
    preparationTimeMinutes: number
  ): Promise<number> {
    const fixedCostPerHour = await this.calculateFixedCostPerHour();
    const preparationTimeHours = preparationTimeMinutes / 60;

    return fixedCostPerHour * preparationTimeHours;
  }

  async getFixedCostsByCategory(): Promise<
    Record<string, { total: number; costs: FixedCost[] }>
  > {
    const activeCosts = await this.getActiveFixedCosts();
    const categorized: Record<string, { total: number; costs: FixedCost[] }> =
      {};

    activeCosts.forEach((cost) => {
      const value = parseFloat(String(cost.value));
      let monthlyValue = 0;

      switch (cost.recurrence) {
        case 'monthly':
          monthlyValue = value;
          break;
        case 'quarterly':
          monthlyValue = value / 3;
          break;
        case 'yearly':
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

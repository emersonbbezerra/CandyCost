import { Request, Response } from 'express';
import { insertFixedCostSchema } from '../../shared/schema';
import { fixedCostRepository } from '../repositories/fixedCostRepository';
import { priceHistoryRepository } from '../repositories/priceHistoryRepository';
import { FixedCostService } from '../services/fixedCostService';
import { productService } from '../services/productService';

export class FixedCostController {
  private fixedCostRepository = fixedCostRepository;
  private fixedCostService = new FixedCostService();

  async getAll(req: Request, res: Response) {
    try {
      const fixedCosts = await this.fixedCostRepository.findAll();
      res.json(fixedCosts);
    } catch (error) {
      console.error('Erro ao buscar custos fixos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const fixedCosts = await this.fixedCostRepository.findActive();
      res.json(fixedCosts);
    } catch (error) {
      console.error('Erro ao buscar custos fixos ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const fixedCost = await this.fixedCostRepository.findById(id);

      if (!fixedCost) {
        return res.status(404).json({ error: 'Custo fixo não encontrado' });
      }

      res.json(fixedCost);
    } catch (error) {
      console.error('Erro ao buscar custo fixo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = insertFixedCostSchema.parse(req.body);
      const fixedCost = await this.fixedCostRepository.create(validatedData);
      res.status(201).json(fixedCost);
    } catch (error) {
      console.error('Erro ao criar custo fixo:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const validatedData = insertFixedCostSchema.partial().parse(req.body);
      const previousFixedCost = await this.fixedCostRepository.findById(id);
      if (!previousFixedCost) {
        return res.status(404).json({ error: 'Custo fixo não encontrado' });
      }
      // Capturar custos dos produtos antes da atualização para registrar diferenças
      const productsBefore = await productService.getProducts();
      const productCostsBefore: Record<string, number> = {};
      for (const p of productsBefore) {
        try {
          const costInfo = await productService.calculateProductCost(p.id);
          // custo por unidade de rendimento para ficar consistente com histórico
          const perUnit =
            costInfo.costPerYieldUnit ||
            costInfo.totalCost / (costInfo.yield || 1);
          productCostsBefore[p.id] = perUnit;
        } catch (e) {
          // ignora falha individual
        }
      }

      const fixedCost = await this.fixedCostRepository.update(
        id,
        validatedData
      );

      if (!fixedCost) {
        return res.status(404).json({ error: 'Custo fixo não encontrado' });
      }
      // Histórico agregado do próprio custo fixo
      try {
        await priceHistoryRepository.create({
          itemType: 'fixed_cost',
          itemName: fixedCost.name,
          oldPrice: Number(previousFixedCost.value),
          newPrice: Number(fixedCost.value),
          changeType: 'fixed_cost_update',
          description: 'Alteração de valor/configuração de custo fixo',
        });
      } catch (e) {
        console.error('Falha ao registrar histórico agregado de custo fixo', e);
      }
      // Recalcular custos após atualização e gerar histórico de modificações
      const productsAfter = await productService.getProducts();
      for (const p of productsAfter) {
        try {
          const newCostInfo = await productService.calculateProductCost(p.id);
          const newPerUnit =
            newCostInfo.costPerYieldUnit ||
            newCostInfo.totalCost / (newCostInfo.yield || 1);
          const oldPerUnit = productCostsBefore[p.id];
          if (oldPerUnit !== undefined) {
            const diff = Math.abs(newPerUnit - oldPerUnit);
            if (diff > 0) {
              await priceHistoryRepository.create({
                itemType: 'product',
                itemName: p.name,
                productId: p.id,
                oldPrice: oldPerUnit,
                newPrice: newPerUnit,
                changeType: 'fixed_cost_update',
                description: 'Recalculo devido a alteração de custo fixo',
              });
            }
          }
        } catch (e) {
          // ignora falha individual
        }
      }

      res.json(fixedCost);
    } catch (error) {
      console.error('Erro ao atualizar custo fixo:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      const success = await this.fixedCostService.deleteFixedCost(id);
      if (!success) {
        return res.status(404).json({ message: 'Custo fixo não encontrado' });
      }
      // Ao deletar um custo fixo, não precisamos gerar histórico de cada produto (poderia ser pesado), mas poderíamos em melhoria futura.
      res.json({ message: 'Custo fixo excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir custo fixo:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
  async toggleActive(req: Request, res: Response) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const currentFixedCost = await this.fixedCostRepository.findById(id);
      if (!currentFixedCost) {
        return res.status(404).json({ message: 'Custo fixo não encontrado' });
      }

      // Custos antes
      const productsBefore = await productService.getProducts();
      const productCostsBefore: Record<string, number> = {};
      for (const p of productsBefore) {
        try {
          const costInfo = await productService.calculateProductCost(p.id);
          const perUnit =
            costInfo.costPerYieldUnit ||
            costInfo.totalCost / (costInfo.yield || 1);
          productCostsBefore[p.id] = perUnit;
        } catch {}
      }

      const updatedFixedCost = await this.fixedCostRepository.update(id, {
        isActive: !currentFixedCost.isActive,
      });
      if (!updatedFixedCost) {
        return res.status(404).json({ message: 'Custo fixo não encontrado' });
      }

      // Histórico agregado do custo fixo (toggle)
      try {
        await priceHistoryRepository.create({
          itemType: 'fixed_cost',
          itemName: updatedFixedCost.name,
          oldPrice: Number(currentFixedCost.value),
          newPrice: Number(updatedFixedCost.value),
          changeType: 'fixed_cost_toggle',
          description: updatedFixedCost.isActive ? 'Ativado' : 'Desativado',
        });
      } catch (e) {
        console.error(
          'Falha ao registrar histórico agregado de toggle de custo fixo',
          e
        );
      }
      // Custos depois + histórico
      const productsAfter = await productService.getProducts();
      for (const p of productsAfter) {
        try {
          const newCostInfo = await productService.calculateProductCost(p.id);
          const newPerUnit =
            newCostInfo.costPerYieldUnit ||
            newCostInfo.totalCost / (newCostInfo.yield || 1);
          const oldPerUnit = productCostsBefore[p.id];
          if (oldPerUnit !== undefined) {
            const diff = Math.abs(newPerUnit - oldPerUnit);
            if (diff > 0) {
              await priceHistoryRepository.create({
                itemType: 'product',
                itemName: p.name,
                productId: p.id,
                oldPrice: oldPerUnit,
                newPrice: newPerUnit,
                changeType: 'fixed_cost_toggle',
                description:
                  'Recalculo devido a ativação/desativação de custo fixo',
              });
            }
          }
        } catch {}
      }

      res.json(updatedFixedCost);
    } catch (error) {
      console.error('Erro ao alterar status do custo fixo:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getWorkConfiguration(req: Request, res: Response) {
    try {
      const config = await this.fixedCostService.getWorkConfiguration();
      res.json(config);
    } catch (error) {
      console.error('Erro ao buscar configuração de trabalho:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateWorkConfiguration(req: Request, res: Response) {
    try {
      const { id, createdAt, updatedAt, ...data } = req.body;
      const config = await this.fixedCostService.updateWorkConfiguration(data);
      res.json(config);
    } catch (error) {
      console.error('Erro ao atualizar configuração de trabalho:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getFixedCostPerHour(req: Request, res: Response) {
    try {
      const costPerHour =
        await this.fixedCostService.calculateFixedCostPerHour();
      res.json({ costPerHour });
    } catch (error) {
      console.error('Erro ao calcular custo fixo por hora:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getMonthlyTotal(req: Request, res: Response) {
    try {
      const monthlyTotal =
        await this.fixedCostService.calculateMonthlyFixedCosts();
      res.json({ monthlyTotal });
    } catch (error) {
      console.error('Erro ao calcular total mensal:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const categorizedCosts =
        await this.fixedCostService.getFixedCostsByCategory();
      res.json(categorizedCosts);
    } catch (error) {
      console.error('Erro ao buscar custos por categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

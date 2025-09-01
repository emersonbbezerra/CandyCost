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

      // Calcular custos dos produtos ANTES da criação (se o custo fixo for ativo)
      let productCostsBefore: Record<string, number> = {};
      if (validatedData.isActive) {
        const productsBefore = await productService.getProducts();
        for (const p of productsBefore) {
          try {
            const costInfo = await productService.calculateProductCost(p.id);
            const perUnit =
              costInfo.costPerYieldUnit ||
              costInfo.totalCost / (costInfo.yield || 1);
            productCostsBefore[p.id] = perUnit;
          } catch (e) {
            // ignora falha individual
          }
        }
      }

      const fixedCost = await this.fixedCostRepository.create(validatedData);

      // Registrar histórico de criação de custo fixo
      if (fixedCost) {
        try {
          await priceHistoryRepository.create({
            itemType: 'fixed_cost',
            itemName: fixedCost.name,
            oldPrice: 0,
            newPrice: Number(fixedCost.value),
            changeType: 'fixed_cost_create',
            description: 'Novo custo fixo criado',
          });
        } catch (historyError) {
          console.error(
            'Falha ao registrar histórico de criação de custo fixo',
            historyError
          );
        }

        // Calcular custos dos produtos DEPOIS da criação e registrar mudanças (apenas se o custo fixo estiver ativo)
        if (fixedCost.isActive) {
          const productsAfter = await productService.getProducts();
          for (const p of productsAfter) {
            try {
              const newCostInfo = await productService.calculateProductCost(
                p.id
              );
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
                    changeType: 'fixed_cost_create',
                    description: 'Recálculo devido à criação de custo fixo',
                  });
                }
              }
            } catch (e) {
              // ignora falha individual
            }
          }
        }
      }

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
                description: 'Recálculo devido a alteração de custo fixo',
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

      // Buscar o custo fixo antes de deletar para registrar no histórico
      const existingFixedCost = await this.fixedCostRepository.findById(id);

      // Calcular custos dos produtos ANTES da exclusão
      const productsBefore = await productService.getProducts();
      const productCostsBefore: Record<string, number> = {};
      for (const p of productsBefore) {
        try {
          const costInfo = await productService.calculateProductCost(p.id);
          const perUnit =
            costInfo.costPerYieldUnit ||
            costInfo.totalCost / (costInfo.yield || 1);
          productCostsBefore[p.id] = perUnit;
        } catch (e) {
          // ignora falha individual
        }
      }

      const success = await this.fixedCostService.deleteFixedCost(id);
      if (!success) {
        return res.status(404).json({ message: 'Custo fixo não encontrado' });
      }

      // Registrar histórico de deleção
      if (existingFixedCost) {
        try {
          await priceHistoryRepository.create({
            itemType: 'fixed_cost',
            itemName: existingFixedCost.name,
            oldPrice: Number(existingFixedCost.value),
            newPrice: 0,
            changeType: 'fixed_cost_delete',
            description: 'Custo fixo excluído',
          });
        } catch (historyError) {
          console.error(
            'Falha ao registrar histórico de deleção de custo fixo',
            historyError
          );
        }
      }

      // Calcular custos dos produtos DEPOIS da exclusão e registrar mudanças
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
                changeType: 'fixed_cost_delete',
                description: 'Recálculo devido à exclusão de custo fixo',
              });
            }
          }
        } catch (e) {
          // ignora falha individual
        }
      }

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

      // Fazer uma consulta adicional para garantir que temos o estado atualizado
      const refreshedFixedCost = await this.fixedCostRepository.findById(id);
      if (!refreshedFixedCost) {
        return res
          .status(404)
          .json({ message: 'Custo fixo não encontrado após atualização' });
      }

      // Histórico agregado do custo fixo (toggle)
      try {
        console.log('='.repeat(60));
        console.log('🔄 TOGGLE FIXED COST DEBUG INFO:');
        console.log('='.repeat(60));
        console.log('Current Fixed Cost:', {
          id: currentFixedCost.id,
          name: currentFixedCost.name,
          isActive: currentFixedCost.isActive,
        });
        console.log('Refreshed Fixed Cost:', {
          id: refreshedFixedCost.id,
          name: refreshedFixedCost.name,
          isActive: refreshedFixedCost.isActive,
        });
        console.log('History Values:');
        console.log(
          '  OldPrice (current state):',
          currentFixedCost.isActive ? 1 : 0
        );
        console.log(
          '  NewPrice (new state):',
          refreshedFixedCost.isActive ? 1 : 0
        );
        console.log('='.repeat(60));

        const historyData = {
          itemType: 'fixed_cost',
          itemName: refreshedFixedCost.name,
          // Para toggle, usamos 0/1 para representar inativo/ativo
          oldPrice: currentFixedCost.isActive ? 1 : 0,
          newPrice: refreshedFixedCost.isActive ? 1 : 0,
          changeType: 'fixed_cost_toggle',
          description: refreshedFixedCost.isActive ? 'Ativado' : 'Desativado',
        };

        console.log('🎯 Creating History Record with NEW LOGIC:', historyData);
        await priceHistoryRepository.create(historyData);
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
                  'Recálculo devido a ativação/desativação de custo fixo',
              });
            }
          }
        } catch {}
      }

      res.json(refreshedFixedCost);
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

import { Request, Response } from "express";
import { FixedCostRepository } from "../repositories/fixedCostRepository";
import { FixedCostService } from "../services/fixedCostService";
import type { InsertFixedCost, InsertWorkConfiguration } from "../../shared/schema";
import { insertFixedCostSchema } from "../../shared/schema";

export class FixedCostController {
  private fixedCostRepository = new FixedCostRepository();
  private fixedCostService = new FixedCostService();

  async getAll(req: Request, res: Response) {
    try {
      const fixedCosts = await this.fixedCostRepository.findAll();
      res.json(fixedCosts);
    } catch (error) {
      console.error("Erro ao buscar custos fixos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const fixedCosts = await this.fixedCostRepository.findActive();
      res.json(fixedCosts);
    } catch (error) {
      console.error("Erro ao buscar custos fixos ativos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const fixedCost = await this.fixedCostRepository.findById(id);

      if (!fixedCost) {
        return res.status(404).json({ error: "Custo fixo não encontrado" });
      }

      res.json(fixedCost);
    } catch (error) {
      console.error("Erro ao buscar custo fixo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = insertFixedCostSchema.parse(req.body);
      const fixedCost = await this.fixedCostRepository.create(validatedData);
      res.status(201).json(fixedCost);
    } catch (error) {
      console.error("Erro ao criar custo fixo:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFixedCostSchema.partial().parse(req.body);

      const fixedCost = await this.fixedCostRepository.update(id, validatedData);

      if (!fixedCost) {
        return res.status(404).json({ error: "Custo fixo não encontrado" });
      }

      res.json(fixedCost);
    } catch (error) {
      console.error("Erro ao atualizar custo fixo:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await this.fixedCostService.deleteFixedCost(id);

      if (!success) {
        return res.status(404).json({ message: "Custo fixo não encontrado" });
      }

      res.json({ message: "Custo fixo excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir custo fixo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async toggleActive(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const currentFixedCost = await this.fixedCostRepository.findById(id);
      if (!currentFixedCost) {
        return res.status(404).json({ message: "Custo fixo não encontrado" });
      }

      const updatedFixedCost = await this.fixedCostRepository.toggleActive(id, !currentFixedCost.isActive);

      if (!updatedFixedCost) {
        return res.status(404).json({ message: "Custo fixo não encontrado" });
      }

      res.json(updatedFixedCost);
    } catch (error) {
      console.error("Erro ao alterar status do custo fixo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getWorkConfiguration(req: Request, res: Response) {
    try {
      const config = await this.fixedCostService.getWorkConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Erro ao buscar configuração de trabalho:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateWorkConfiguration(req: Request, res: Response) {
    try {
      const data: Partial<InsertWorkConfiguration> = req.body;
      const config = await this.fixedCostService.updateWorkConfiguration(data);
      res.json(config);
    } catch (error) {
      console.error("Erro ao atualizar configuração de trabalho:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getFixedCostPerHour(req: Request, res: Response) {
    try {
      const costPerHour = await this.fixedCostService.calculateFixedCostPerHour();
      res.json({ costPerHour });
    } catch (error) {
      console.error("Erro ao calcular custo fixo por hora:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getMonthlyTotal(req: Request, res: Response) {
    try {
      const monthlyTotal = await this.fixedCostService.calculateMonthlyFixedCosts();
      res.json({ monthlyTotal });
    } catch (error) {
      console.error("Erro ao calcular total mensal:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const categorizedCosts = await this.fixedCostService.getFixedCostsByCategory();
      res.json(categorizedCosts);
    } catch (error) {
      console.error("Erro ao buscar custos por categoria:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
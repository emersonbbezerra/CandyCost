
import { Router } from "express";
import { isAuthenticated } from "../services/userService";

const router = Router();

import { prisma } from "../db";

router.get("/", isAuthenticated, async (req, res) => {
  try {
    // Buscar configuração de trabalho do banco de dados
    const workConfig = await prisma.workConfiguration.findFirst();
    
    if (!workConfig) {
      // Se não existe, criar configuração padrão
      const defaultConfig = await prisma.workConfiguration.create({
        data: {
          hoursPerDay: 8.0,
          daysPerMonth: 22.0,
          hourlyRate: 25.0,
          highCostAlertThreshold: 50.0,
          currencySymbol: "R$",
        }
      });
      
      // Mapear para o formato esperado pelo frontend
      const systemSettings = {
        defaultMarginPercentage: 60,
        priceIncreaseAlertThreshold: 20,
        highCostAlertThreshold: defaultConfig.highCostAlertThreshold,
        enableCostAlerts: true,
        enablePriceAlerts: true,
        autoCalculateMargins: true,
        currencySymbol: defaultConfig.currencySymbol,
        businessName: "Minha Confeitaria"
      };
      
      return res.json(systemSettings);
    }
    
    // Mapear configuração do banco para o formato esperado pelo frontend
    const systemSettings = {
      defaultMarginPercentage: 60,
      priceIncreaseAlertThreshold: 20,
      highCostAlertThreshold: workConfig.highCostAlertThreshold,
      enableCostAlerts: true,
      enablePriceAlerts: true,
      autoCalculateMargins: true,
      currencySymbol: workConfig.currencySymbol,
      businessName: "Minha Confeitaria"
    };
    
    res.json(systemSettings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    res.status(500).json({ message: "Erro ao buscar configurações" });
  }
});

router.put("/", isAuthenticated, async (req, res) => {
  try {
    // Buscar configuração existente
    let workConfig = await prisma.workConfiguration.findFirst();
    
    if (!workConfig) {
      // Se não existe, criar configuração padrão
      workConfig = await prisma.workConfiguration.create({
        data: {
          hoursPerDay: 8.0,
          daysPerMonth: 22.0,
          hourlyRate: 25.0,
          highCostAlertThreshold: req.body.highCostAlertThreshold || 50.0,
          currencySymbol: req.body.currencySymbol || "R$",
        }
      });
    } else {
      // Atualizar configuração existente
      workConfig = await prisma.workConfiguration.update({
        where: { id: workConfig.id },
        data: {
          ...(req.body.highCostAlertThreshold !== undefined && { highCostAlertThreshold: req.body.highCostAlertThreshold }),
          ...(req.body.currencySymbol !== undefined && { currencySymbol: req.body.currencySymbol }),
        }
      });
    }
    
    // Mapear configuração atualizada para o formato esperado pelo frontend
    const systemSettings = {
      defaultMarginPercentage: 60,
      priceIncreaseAlertThreshold: 20,
      highCostAlertThreshold: workConfig.highCostAlertThreshold,
      enableCostAlerts: true,
      enablePriceAlerts: true,
      autoCalculateMargins: true,
      currencySymbol: workConfig.currencySymbol,
      businessName: "Minha Confeitaria"
    };
    
    res.json(systemSettings);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    res.status(500).json({ message: "Erro ao salvar configurações" });
  }
});

export default router;

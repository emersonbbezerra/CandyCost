import { Router } from 'express';
import { isAuthenticated } from '../services/userService';

const router = Router();

import { prisma } from '../db';

router.get('/', isAuthenticated, async (req, res) => {
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
          currencySymbol: 'R$',
          enableCostAlerts: true,
          enablePriceAlerts: true,
          defaultMarginPercentage: 60.0,
          priceIncreaseAlertThreshold: 20.0,
          autoCalculateMargins: true,
          businessName: 'Minha Confeitaria',
        },
      });

      // Mapear para o formato esperado pelo frontend
      const systemSettings = {
        defaultMarginPercentage: defaultConfig.defaultMarginPercentage,
        priceIncreaseAlertThreshold: defaultConfig.priceIncreaseAlertThreshold,
        highCostAlertThreshold: defaultConfig.highCostAlertThreshold,
        enableCostAlerts: defaultConfig.enableCostAlerts,
        enablePriceAlerts: defaultConfig.enablePriceAlerts,
        autoCalculateMargins: defaultConfig.autoCalculateMargins,
        currencySymbol: defaultConfig.currencySymbol,
        businessName: defaultConfig.businessName,
      };

      return res.json(systemSettings);
    }

    // Mapear configuração do banco para o formato esperado pelo frontend
    const systemSettings = {
      defaultMarginPercentage: workConfig.defaultMarginPercentage,
      priceIncreaseAlertThreshold: workConfig.priceIncreaseAlertThreshold,
      highCostAlertThreshold: workConfig.highCostAlertThreshold,
      enableCostAlerts: workConfig.enableCostAlerts,
      enablePriceAlerts: workConfig.enablePriceAlerts,
      autoCalculateMargins: workConfig.autoCalculateMargins,
      currencySymbol: workConfig.currencySymbol,
      businessName: workConfig.businessName,
    };

    res.json(systemSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ message: 'Erro ao buscar configurações' });
  }
});

router.put('/', isAuthenticated, async (req, res) => {
  try {
    console.log('🔧 [API Settings] Recebendo dados para salvar:', req.body);

    // Buscar configuração existente
    let workConfig = await prisma.workConfiguration.findFirst();

    if (!workConfig) {
      // Se não existe, criar configuração padrão com os dados recebidos
      workConfig = await prisma.workConfiguration.create({
        data: {
          hoursPerDay: req.body.hoursPerDay || 8.0,
          daysPerMonth: req.body.daysPerMonth || 22.0,
          hourlyRate: req.body.hourlyRate || 25.0,
          highCostAlertThreshold: req.body.highCostAlertThreshold || 50.0,
          currencySymbol: req.body.currencySymbol || 'R$',
          enableCostAlerts: req.body.enableCostAlerts ?? true,
          enablePriceAlerts: req.body.enablePriceAlerts ?? true,
          defaultMarginPercentage: req.body.defaultMarginPercentage || 60.0,
          priceIncreaseAlertThreshold:
            req.body.priceIncreaseAlertThreshold || 20.0,
          autoCalculateMargins: req.body.autoCalculateMargins ?? true,
          businessName: req.body.businessName || 'Minha Confeitaria',
        },
      });
    } else {
      // Atualizar configuração existente
      workConfig = await prisma.workConfiguration.update({
        where: { id: workConfig.id },
        data: {
          ...(req.body.hoursPerDay !== undefined && {
            hoursPerDay: req.body.hoursPerDay,
          }),
          ...(req.body.daysPerMonth !== undefined && {
            daysPerMonth: req.body.daysPerMonth,
          }),
          ...(req.body.hourlyRate !== undefined && {
            hourlyRate: req.body.hourlyRate,
          }),
          ...(req.body.highCostAlertThreshold !== undefined && {
            highCostAlertThreshold: req.body.highCostAlertThreshold,
          }),
          ...(req.body.currencySymbol !== undefined && {
            currencySymbol: req.body.currencySymbol,
          }),
          ...(req.body.enableCostAlerts !== undefined && {
            enableCostAlerts: req.body.enableCostAlerts,
          }),
          ...(req.body.enablePriceAlerts !== undefined && {
            enablePriceAlerts: req.body.enablePriceAlerts,
          }),
          ...(req.body.defaultMarginPercentage !== undefined && {
            defaultMarginPercentage: req.body.defaultMarginPercentage,
          }),
          ...(req.body.priceIncreaseAlertThreshold !== undefined && {
            priceIncreaseAlertThreshold: req.body.priceIncreaseAlertThreshold,
          }),
          ...(req.body.autoCalculateMargins !== undefined && {
            autoCalculateMargins: req.body.autoCalculateMargins,
          }),
          ...(req.body.businessName !== undefined && {
            businessName: req.body.businessName,
          }),
        },
      });
    }

    console.log('✅ [API Settings] Configuração salva no banco:', workConfig);

    // Mapear configuração atualizada para o formato esperado pelo frontend
    const systemSettings = {
      defaultMarginPercentage: workConfig.defaultMarginPercentage,
      priceIncreaseAlertThreshold: workConfig.priceIncreaseAlertThreshold,
      highCostAlertThreshold: workConfig.highCostAlertThreshold,
      enableCostAlerts: workConfig.enableCostAlerts,
      enablePriceAlerts: workConfig.enablePriceAlerts,
      autoCalculateMargins: workConfig.autoCalculateMargins,
      currencySymbol: workConfig.currencySymbol,
      businessName: workConfig.businessName,
    };

    res.json(systemSettings);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ message: 'Erro ao salvar configurações' });
  }
});

export default router;

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
          // Configurações de dias da semana (padrão: segunda a sexta)
          workMonday: true,
          workTuesday: true,
          workWednesday: true,
          workThursday: true,
          workFriday: true,
          workSaturday: false,
          workSunday: false,
        },
      });

      // Mapear para o formato esperado pelo frontend (incluindo TODAS as configurações)
      const systemSettings = {
        // Configurações básicas de negócio
        defaultMarginPercentage: defaultConfig.defaultMarginPercentage,
        priceIncreaseAlertThreshold: defaultConfig.priceIncreaseAlertThreshold,
        highCostAlertThreshold: defaultConfig.highCostAlertThreshold,
        enableCostAlerts: defaultConfig.enableCostAlerts,
        enablePriceAlerts: defaultConfig.enablePriceAlerts,
        autoCalculateMargins: defaultConfig.autoCalculateMargins,
        currencySymbol: defaultConfig.currencySymbol,
        businessName: defaultConfig.businessName,
        // Configurações de trabalho
        hoursPerDay: defaultConfig.hoursPerDay,
        daysPerMonth: defaultConfig.daysPerMonth,
        hourlyRate: defaultConfig.hourlyRate,
        // Configurações de dias da semana
        workMonday: defaultConfig.workMonday || true,
        workTuesday: defaultConfig.workTuesday || true,
        workWednesday: defaultConfig.workWednesday || true,
        workThursday: defaultConfig.workThursday || true,
        workFriday: defaultConfig.workFriday || true,
        workSaturday: defaultConfig.workSaturday || false,
        workSunday: defaultConfig.workSunday || false,
        // Campos calculados
        annualWorkingDays: defaultConfig.annualWorkingDays,
        annualWorkingHours: defaultConfig.annualWorkingHours,
        monthlyWorkingHours: defaultConfig.monthlyWorkingHours,
      };

      return res.json(systemSettings);
    }

    // Mapear configuração do banco para o formato esperado pelo frontend (TODAS as configurações)
    const systemSettings = {
      // Configurações básicas de negócio
      defaultMarginPercentage: workConfig.defaultMarginPercentage,
      priceIncreaseAlertThreshold: workConfig.priceIncreaseAlertThreshold,
      highCostAlertThreshold: workConfig.highCostAlertThreshold,
      enableCostAlerts: workConfig.enableCostAlerts,
      enablePriceAlerts: workConfig.enablePriceAlerts,
      autoCalculateMargins: workConfig.autoCalculateMargins,
      currencySymbol: workConfig.currencySymbol,
      businessName: workConfig.businessName,
      // Configurações de trabalho
      hoursPerDay: workConfig.hoursPerDay,
      daysPerMonth: workConfig.daysPerMonth,
      hourlyRate: workConfig.hourlyRate,
      // Configurações de dias da semana
      workMonday: workConfig.workMonday,
      workTuesday: workConfig.workTuesday,
      workWednesday: workConfig.workWednesday,
      workThursday: workConfig.workThursday,
      workFriday: workConfig.workFriday,
      workSaturday: workConfig.workSaturday,
      workSunday: workConfig.workSunday,
      // Campos calculados
      annualWorkingDays: workConfig.annualWorkingDays,
      annualWorkingHours: workConfig.annualWorkingHours,
      monthlyWorkingHours: workConfig.monthlyWorkingHours,
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
      // Se não existe, criar configuração padrão com os dados recebidos (TODAS as configurações)
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
          // Configurações de dias da semana
          workMonday: req.body.workMonday ?? true,
          workTuesday: req.body.workTuesday ?? true,
          workWednesday: req.body.workWednesday ?? true,
          workThursday: req.body.workThursday ?? true,
          workFriday: req.body.workFriday ?? true,
          workSaturday: req.body.workSaturday ?? false,
          workSunday: req.body.workSunday ?? false,
          // Campos calculados (se fornecidos)
          annualWorkingDays: req.body.annualWorkingDays,
          annualWorkingHours: req.body.annualWorkingHours,
          monthlyWorkingHours: req.body.monthlyWorkingHours,
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
          // Configurações de dias da semana
          ...(req.body.workMonday !== undefined && {
            workMonday: req.body.workMonday,
          }),
          ...(req.body.workTuesday !== undefined && {
            workTuesday: req.body.workTuesday,
          }),
          ...(req.body.workWednesday !== undefined && {
            workWednesday: req.body.workWednesday,
          }),
          ...(req.body.workThursday !== undefined && {
            workThursday: req.body.workThursday,
          }),
          ...(req.body.workFriday !== undefined && {
            workFriday: req.body.workFriday,
          }),
          ...(req.body.workSaturday !== undefined && {
            workSaturday: req.body.workSaturday,
          }),
          ...(req.body.workSunday !== undefined && {
            workSunday: req.body.workSunday,
          }),
          // Campos calculados
          ...(req.body.annualWorkingDays !== undefined && {
            annualWorkingDays: req.body.annualWorkingDays,
          }),
          ...(req.body.annualWorkingHours !== undefined && {
            annualWorkingHours: req.body.annualWorkingHours,
          }),
          ...(req.body.monthlyWorkingHours !== undefined && {
            monthlyWorkingHours: req.body.monthlyWorkingHours,
          }),
        },
      });
    }

    console.log('✅ [API Settings] Configuração salva no banco:', workConfig);

    // Mapear configuração atualizada para o formato esperado pelo frontend (TODAS as configurações)
    const systemSettings = {
      // Configurações básicas de negócio
      defaultMarginPercentage: workConfig.defaultMarginPercentage,
      priceIncreaseAlertThreshold: workConfig.priceIncreaseAlertThreshold,
      highCostAlertThreshold: workConfig.highCostAlertThreshold,
      enableCostAlerts: workConfig.enableCostAlerts,
      enablePriceAlerts: workConfig.enablePriceAlerts,
      autoCalculateMargins: workConfig.autoCalculateMargins,
      currencySymbol: workConfig.currencySymbol,
      businessName: workConfig.businessName,
      // Configurações de trabalho
      hoursPerDay: workConfig.hoursPerDay,
      daysPerMonth: workConfig.daysPerMonth,
      hourlyRate: workConfig.hourlyRate,
      // Configurações de dias da semana
      workMonday: workConfig.workMonday,
      workTuesday: workConfig.workTuesday,
      workWednesday: workConfig.workWednesday,
      workThursday: workConfig.workThursday,
      workFriday: workConfig.workFriday,
      workSaturday: workConfig.workSaturday,
      workSunday: workConfig.workSunday,
      // Campos calculados
      annualWorkingDays: workConfig.annualWorkingDays,
      annualWorkingHours: workConfig.annualWorkingHours,
      monthlyWorkingHours: workConfig.monthlyWorkingHours,
    };

    res.json(systemSettings);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ message: 'Erro ao salvar configurações' });
  }
});

export default router;

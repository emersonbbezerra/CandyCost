import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './db';
import { userService } from './services/userService';
import {
  calculateWorkingDays,
  type WorkingDaysConfig,
} from './utils/workingDaysCalculator';

async function setupSessionsTable() {
  try {
    // Drop existing sessions table if it exists
    await prisma.$executeRaw`DROP TABLE IF EXISTS sessions CASCADE`;

    // Create sessions table with correct structure for connect-pg-simple
    await prisma.$executeRaw`
      CREATE TABLE sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `;

    await prisma.$executeRaw`
      ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
    `;

    await prisma.$executeRaw`
      CREATE INDEX IDX_session_expire ON sessions (expire);
    `;

    console.log('✓ Sessions table configured successfully!');
  } catch (error) {
    console.error('Error setting up sessions table:', error);
    throw error;
  }
}

async function seed() {
  try {
    // Setup sessions table first
    await setupSessionsTable();

    // Check if data already exists
    const existingIngredients = await prisma.ingredient.count();
    const existingProducts = await prisma.product.count();
    const existingFixedCosts = await prisma.fixedCost.count();

    if (
      existingIngredients > 0 ||
      existingProducts > 0 ||
      existingFixedCosts > 0
    ) {
      console.log(
        '✓ Dados já existem no banco - pulando inserção de dados de exemplo'
      );

      // Ainda assim, vamos garantir que o usuário admin existe
      await userService.createAdminUser();
      console.log('✓ Verificação de usuário admin concluída');
      return;
    }

    console.log('📝 Inserindo dados de exemplo...');

    // Ingredientes de exemplo
    const sampleIngredients = [
      {
        name: 'Farinha de Trigo',
        category: 'Farinhas',
        quantity: 5,
        unit: 'kg',
        price: 12.5,
        brand: 'Marca Premium',
      },
      {
        name: 'Leite Condensado',
        category: 'Laticínios',
        quantity: 0.395,
        unit: 'kg',
        price: 4.5,
        brand: 'Marca Top',
      },
      {
        name: 'Chocolate 70%',
        category: 'Chocolates',
        quantity: 1,
        unit: 'kg',
        price: 45.0,
        brand: 'Premium',
      },
      {
        name: 'Açúcar Cristal',
        category: 'Açúcares',
        quantity: 5,
        unit: 'kg',
        price: 18.9,
        brand: 'União',
      },
      {
        name: 'Manteiga sem Sal',
        category: 'Laticínios',
        quantity: 0.5,
        unit: 'kg',
        price: 15.2,
        brand: 'Elegê',
      },
      {
        name: 'Ovos',
        category: 'Outros',
        quantity: 30,
        unit: 'un',
        price: 18.0,
        brand: 'Caipira',
      },
      {
        name: 'Creme de Leite',
        category: 'Laticínios',
        quantity: 0.2,
        unit: 'kg',
        price: 3.5,
        brand: 'Nestlé',
      },
      {
        name: 'Açúcar de Confeiteiro',
        category: 'Açúcares',
        quantity: 1,
        unit: 'kg',
        price: 8.9,
        brand: 'União',
      },
      {
        name: 'Essência de Baunilha',
        category: 'Essências',
        quantity: 0.03,
        unit: 'kg',
        price: 12.0,
        brand: 'Mix',
      },
      {
        name: 'Fermento em Pó',
        category: 'Fermentos',
        quantity: 0.1,
        unit: 'kg',
        price: 4.2,
        brand: 'Royal',
      },
      {
        name: 'Leite Integral',
        category: 'Laticínios',
        quantity: 1,
        unit: 'l',
        price: 5.5,
        brand: 'Itambé',
      },
      {
        name: 'Morango Fresco',
        category: 'Frutas',
        quantity: 0.5,
        unit: 'kg',
        price: 8.0,
        brand: 'Local',
      },
      {
        name: 'Chocolate Branco',
        category: 'Chocolates',
        quantity: 1,
        unit: 'kg',
        price: 38.0,
        brand: 'Harald',
      },
      {
        name: 'Nozes Picadas',
        category: 'Oleaginosas',
        quantity: 0.2,
        unit: 'kg',
        price: 25.0,
        brand: 'Premium',
      },
      {
        name: 'Açaí Polpa',
        category: 'Frutas',
        quantity: 1,
        unit: 'kg',
        price: 15.0,
        brand: 'Amazônia',
      },
      {
        name: 'Granola',
        category: 'Cereais',
        quantity: 0.5,
        unit: 'kg',
        price: 12.0,
        brand: 'Mãe Terra',
      },
      // Ingredientes para teste de conversão de unidades
      {
        name: 'Ovos Especiais',
        category: 'Outros',
        quantity: 2, // 2 dúzias = 24 unidades
        unit: 'dúzia',
        price: 36.0,
        brand: 'Caipira Premium',
      },
      {
        name: 'Farinha Especial',
        category: 'Farinhas',
        quantity: 2000, // 2000g = 2kg
        unit: 'g',
        price: 8.5,
        brand: 'Especial',
      },
    ];

    // Inserir ingredientes
    const insertedIngredients = [];
    for (const ingredient of sampleIngredients) {
      const inserted = await prisma.ingredient.create({
        data: {
          name: ingredient.name,
          category: ingredient.category,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          price: ingredient.price,
          brand: ingredient.brand,
        },
      });
      insertedIngredients.push(inserted);
    }

    // Produtos de exemplo (valores abaixo em unitSalePrice = preço unitário; será convertido para total)
    const sampleProducts = [
      {
        name: 'Brigadeiro Gourmet',
        category: 'Doces',
        description: 'Brigadeiro cremoso de chocolate',
        isAlsoIngredient: true,
        marginPercentage: 70,
        preparationTimeMinutes: 30,
        unitSalePrice: 2.5,
        yield: 30,
        yieldUnit: 'un',
      },
      {
        name: 'Cupcake de Baunilha',
        category: 'Bolos',
        description: 'Cupcake com cobertura de baunilha',
        isAlsoIngredient: false,
        marginPercentage: 60,
        preparationTimeMinutes: 45,
        unitSalePrice: 5.0,
        yield: 12,
        yieldUnit: 'un',
      },
      {
        name: 'Trufa de Chocolate Branco',
        category: 'Doces',
        description: 'Trufa artesanal de chocolate branco',
        isAlsoIngredient: false,
        marginPercentage: 65,
        preparationTimeMinutes: 60,
        unitSalePrice: 3.5,
        yield: 20,
        yieldUnit: 'un',
      },
      {
        name: 'Torta de Chocolate',
        category: 'Tortas Tradicionais',
        description: 'Torta de chocolate com cobertura',
        isAlsoIngredient: false,
        marginPercentage: 35,
        preparationTimeMinutes: 120,
        unitSalePrice: 80.0 / 12,
        yield: 12,
        yieldUnit: 'fatia',
      },
      {
        name: 'Bolo de Morango',
        category: 'Bolos',
        description: 'Bolo com recheio de morango e chantilly',
        isAlsoIngredient: false,
        marginPercentage: 40,
        preparationTimeMinutes: 90,
        unitSalePrice: 75.0 / 12,
        yield: 12,
        yieldUnit: 'fatia',
      },
      {
        name: 'Cheesecake de Frutas Vermelhas',
        category: 'Tortas Especiais',
        description: 'Cheesecake cremoso com frutas',
        isAlsoIngredient: false,
        marginPercentage: 45,
        preparationTimeMinutes: 180,
        unitSalePrice: 90.0 / 14,
        yield: 14,
        yieldUnit: 'fatia',
      },
      {
        name: 'Açaí na Tigela Premium',
        category: 'Sobremesas',
        description: 'Açaí com granola, frutas e mel',
        isAlsoIngredient: false,
        marginPercentage: 25,
        preparationTimeMinutes: 10,
        unitSalePrice: 18.0,
        yield: 1,
        yieldUnit: 'porção',
      },
      {
        name: 'Brownie com Nozes',
        category: 'Doces',
        description: 'Brownie denso com nozes caramelizadas',
        isAlsoIngredient: false,
        marginPercentage: 20,
        preparationTimeMinutes: 50,
        unitSalePrice: 6.0,
        yield: 10,
        yieldUnit: 'un',
      },
      {
        name: 'Torta Holandesa',
        category: 'Tortas Especiais',
        description: 'Torta com creme e chocolate premium',
        isAlsoIngredient: false,
        marginPercentage: 15,
        preparationTimeMinutes: 150,
        unitSalePrice: 95.0 / 14,
        yield: 14,
        yieldUnit: 'fatia',
      },
      {
        name: 'Beijinho Gourmet',
        category: 'Doces',
        description: 'Beijinho artesanal com coco premium',
        isAlsoIngredient: false,
        marginPercentage: 200,
        preparationTimeMinutes: 25,
        unitSalePrice: 2.5,
        yield: 30,
        yieldUnit: 'un',
      },
      {
        name: 'Fatia de Bolo Red Velvet',
        category: 'Fatias',
        description: 'Fatia individual de bolo red velvet',
        isAlsoIngredient: false,
        marginPercentage: 80,
        preparationTimeMinutes: 5,
        unitSalePrice: 9.0,
        yield: 1,
        yieldUnit: 'fatia',
      },
      {
        name: 'Calda de Chocolate',
        category: 'Caldas',
        description: 'Calda de chocolate cremosa',
        isAlsoIngredient: true,
        marginPercentage: 100,
        preparationTimeMinutes: 15,
        unitSalePrice: 35.0,
        yield: 1,
        yieldUnit: 'kg',
      },
      {
        name: 'Recheio de Brigadeiro',
        category: 'Recheios',
        description: 'Recheio cremoso de brigadeiro',
        isAlsoIngredient: true,
        marginPercentage: 120,
        preparationTimeMinutes: 20,
        unitSalePrice: 30.0,
        yield: 1,
        yieldUnit: 'kg',
      },
      {
        name: 'Cobertura de Ganache',
        category: 'Coberturas',
        description: 'Cobertura de ganache premium',
        isAlsoIngredient: true,
        marginPercentage: 90,
        preparationTimeMinutes: 25,
        unitSalePrice: 40.0,
        yield: 1,
        yieldUnit: 'kg',
      },
      {
        name: 'Caseirinho de Chocolate',
        category: 'Caseirinhos',
        description: 'Doce caseiro de chocolate',
        isAlsoIngredient: false,
        marginPercentage: 150,
        preparationTimeMinutes: 40,
        unitSalePrice: 3.0,
        yield: 10,
        yieldUnit: 'un',
      },
    ];

    // Inserir produtos
    const insertedProducts = [];
    for (const product of sampleProducts) {
      const totalSalePrice = Number(
        (product.unitSalePrice * product.yield).toFixed(2)
      );
      const inserted = await prisma.product.create({
        data: {
          name: product.name,
          category: product.category,
          description: product.description,
          isAlsoIngredient: product.isAlsoIngredient,
          marginPercentage: product.marginPercentage,
          preparationTimeMinutes: product.preparationTimeMinutes,
          salePrice: totalSalePrice, // armazenado como preço TOTAL
          yield: product.yield,
          yieldUnit: product.yieldUnit,
        },
      });
      insertedProducts.push(inserted);
      // Histórico inicial de preço (por unidade) - oldPrice = newPrice
      await prisma.priceHistory.create({
        data: {
          itemType: 'product',
          itemName: product.name,
          oldPrice: Number(product.unitSalePrice.toFixed(2)),
          newPrice: Number(product.unitSalePrice.toFixed(2)),
          changeType: 'initial_seed',
          description: 'Preço unitário inicial (seed)',
          productId: inserted.id,
        },
      });
    }

    // Sample recipes
    const sampleRecipes = [
      {
        productIndex: 0,
        ingredientIndex: 1,
        productIngredientIndex: null,
        quantity: '0.395',
        unit: 'kg',
      },
      {
        productIndex: 0,
        ingredientIndex: 2,
        productIngredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 0,
        ingredientIndex: 4,
        productIngredientIndex: null,
        quantity: '0.05',
        unit: 'kg',
      },
      {
        productIndex: 1,
        ingredientIndex: 0,
        productIngredientIndex: null,
        quantity: '0.15',
        unit: 'kg',
      },
      {
        productIndex: 1,
        ingredientIndex: 3,
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      {
        productIndex: 1,
        ingredientIndex: 5,
        productIngredientIndex: null,
        quantity: '2',
        unit: 'un',
      },
      {
        productIndex: 1,
        ingredientIndex: 8,
        productIngredientIndex: null,
        quantity: '0.005',
        unit: 'kg',
      },
      {
        productIndex: 2,
        ingredientIndex: 12,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 2,
        ingredientIndex: 6,
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      {
        productIndex: 2,
        ingredientIndex: 4,
        productIngredientIndex: null,
        quantity: '0.02',
        unit: 'kg',
      },
      {
        productIndex: 3,
        ingredientIndex: 0,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 3,
        ingredientIndex: 2,
        productIngredientIndex: null,
        quantity: '0.25',
        unit: 'kg',
      },
      {
        productIndex: 3,
        ingredientIndex: 3,
        productIngredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 3,
        productIngredientIndex: 0,
        ingredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 4,
        ingredientIndex: 0,
        productIngredientIndex: null,
        quantity: '0.4',
        unit: 'kg',
      },
      {
        productIndex: 4,
        ingredientIndex: 3,
        productIngredientIndex: null,
        quantity: '0.25',
        unit: 'kg',
      },
      {
        productIndex: 4,
        ingredientIndex: 5,
        productIngredientIndex: null,
        quantity: '6',
        unit: 'un',
      },
      {
        productIndex: 4,
        ingredientIndex: 10,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'l',
      },
      {
        productIndex: 4,
        ingredientIndex: 11,
        productIngredientIndex: null,
        quantity: '0.5',
        unit: 'kg',
      },
      {
        productIndex: 5,
        ingredientIndex: 6,
        productIngredientIndex: null,
        quantity: '0.4',
        unit: 'kg',
      },
      {
        productIndex: 5,
        ingredientIndex: 7,
        productIngredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 5,
        ingredientIndex: 5,
        productIngredientIndex: null,
        quantity: '4',
        unit: 'un',
      },
      {
        productIndex: 5,
        ingredientIndex: 11,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 6,
        ingredientIndex: 14,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 6,
        ingredientIndex: 15,
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      {
        productIndex: 6,
        ingredientIndex: 11,
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      {
        productIndex: 7,
        ingredientIndex: 2,
        productIngredientIndex: null,
        quantity: '0.4',
        unit: 'kg',
      },
      {
        productIndex: 7,
        ingredientIndex: 0,
        productIngredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 7,
        ingredientIndex: 13,
        productIngredientIndex: null,
        quantity: '0.15',
        unit: 'kg',
      },
      {
        productIndex: 7,
        ingredientIndex: 4,
        productIngredientIndex: null,
        quantity: '0.15',
        unit: 'kg',
      },
      {
        productIndex: 7,
        ingredientIndex: 5,
        productIngredientIndex: null,
        quantity: '4',
        unit: 'un',
      },
      {
        productIndex: 8,
        ingredientIndex: 12,
        productIngredientIndex: null,
        quantity: '0.5',
        unit: 'kg',
      },
      {
        productIndex: 8,
        ingredientIndex: 2,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 8,
        ingredientIndex: 6,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 8,
        ingredientIndex: 13,
        productIngredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 8,
        ingredientIndex: 5,
        productIngredientIndex: null,
        quantity: '6',
        unit: 'un',
      },
      {
        productIndex: 9,
        ingredientIndex: 1,
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      {
        productIndex: 9,
        ingredientIndex: 4,
        productIngredientIndex: null,
        quantity: '0.02',
        unit: 'kg',
      },
      {
        productIndex: 9,
        ingredientIndex: 3,
        productIngredientIndex: null,
        quantity: '0.03',
        unit: 'kg',
      },
      // --- Novas receitas adicionadas para produtos que estavam sem composição ---
      // productIndex 10: Fatia de Bolo Red Velvet (simples, 1 fatia)
      {
        productIndex: 10,
        ingredientIndex: 0, // Farinha de Trigo
        productIngredientIndex: null,
        quantity: '0.02',
        unit: 'kg',
      },
      {
        productIndex: 10,
        ingredientIndex: 3, // Açúcar Cristal
        productIngredientIndex: null,
        quantity: '0.015',
        unit: 'kg',
      },
      {
        productIndex: 10,
        ingredientIndex: 5, // Ovos
        productIngredientIndex: null,
        quantity: '1',
        unit: 'un',
      },
      // productIndex 11: Calda de Chocolate (1 kg)
      {
        productIndex: 11,
        ingredientIndex: 2, // Chocolate 70%
        productIngredientIndex: null,
        quantity: '0.4',
        unit: 'kg',
      },
      {
        productIndex: 11,
        ingredientIndex: 10, // Leite Integral
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'l',
      },
      {
        productIndex: 11,
        ingredientIndex: 3, // Açúcar Cristal
        productIngredientIndex: null,
        quantity: '0.2',
        unit: 'kg',
      },
      {
        productIndex: 11,
        ingredientIndex: 4, // Manteiga
        productIngredientIndex: null,
        quantity: '0.05',
        unit: 'kg',
      },
      // productIndex 12: Recheio de Brigadeiro (1 kg)
      {
        productIndex: 12,
        ingredientIndex: 1, // Leite Condensado
        productIngredientIndex: null,
        quantity: '0.395',
        unit: 'kg',
      },
      {
        productIndex: 12,
        ingredientIndex: 2, // Chocolate 70%
        productIngredientIndex: null,
        quantity: '0.25',
        unit: 'kg',
      },
      {
        productIndex: 12,
        ingredientIndex: 4, // Manteiga
        productIngredientIndex: null,
        quantity: '0.05',
        unit: 'kg',
      },
      {
        productIndex: 12,
        ingredientIndex: 6, // Creme de Leite
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      // productIndex 13: Cobertura de Ganache (1 kg)
      {
        productIndex: 13,
        ingredientIndex: 12, // Chocolate Branco
        productIngredientIndex: null,
        quantity: '0.5',
        unit: 'kg',
      },
      {
        productIndex: 13,
        ingredientIndex: 6, // Creme de Leite
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'kg',
      },
      {
        productIndex: 13,
        ingredientIndex: 4, // Manteiga
        productIngredientIndex: null,
        quantity: '0.05',
        unit: 'kg',
      },
      {
        productIndex: 13,
        ingredientIndex: 3, // Açúcar Cristal
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      // productIndex 14: Caseirinho de Chocolate (10 un)
      {
        productIndex: 14,
        ingredientIndex: 0, // Farinha de Trigo
        productIngredientIndex: null,
        quantity: '0.1',
        unit: 'kg',
      },
      {
        productIndex: 14,
        ingredientIndex: 3, // Açúcar Cristal
        productIngredientIndex: null,
        quantity: '0.08',
        unit: 'kg',
      },
      {
        productIndex: 14,
        ingredientIndex: 2, // Chocolate 70%
        productIngredientIndex: null,
        quantity: '0.05',
        unit: 'kg',
      },
      {
        productIndex: 14,
        ingredientIndex: 5, // Ovos
        productIngredientIndex: null,
        quantity: '2',
        unit: 'un',
      },
    ];

    // Inserir receitas
    for (const recipe of sampleRecipes) {
      await prisma.recipe.create({
        data: {
          productId: insertedProducts[recipe.productIndex].id,
          ingredientId:
            recipe.ingredientIndex !== null
              ? insertedIngredients[recipe.ingredientIndex].id
              : null,
          productIngredientId:
            recipe.productIngredientIndex !== null
              ? insertedProducts[recipe.productIngredientIndex].id
              : null,
          quantity: parseFloat(recipe.quantity),
          unit: recipe.unit,
        },
      });
    }

    // Inserir histórico de preços (PriceHistory)
    const samplePriceHistory = [
      {
        itemType: 'ingredient',
        itemName: 'Farinha de Trigo',
        // valores por unidade (preço por kg)
        oldPrice: 2.0,
        newPrice: 2.5,
        changeType: 'manual',
        description: 'Ajuste de preço por unidade (kg)',
        ingredientId: insertedIngredients[0].id,
      },
      {
        itemType: 'product',
        itemName: 'Brigadeiro Gourmet',
        // valores por unidade (custo por unidade de rendimento)
        oldPrice: 2.0,
        newPrice: 2.5,
        changeType: 'ingredient_update',
        description:
          'Atualização de custo por unidade após mudança no preço do chocolate',
        productId: insertedProducts[0].id,
      },
    ];
    for (const ph of samplePriceHistory) {
      await prisma.priceHistory.create({
        data: {
          itemType: ph.itemType,
          itemName: ph.itemName,
          oldPrice: ph.oldPrice,
          newPrice: ph.newPrice,
          changeType: ph.changeType,
          description: ph.description,
          ingredientId: ph.ingredientId || null,
          productId: ph.productId || null,
        },
      });
    }

    // Inserir configuração de trabalho (WorkConfiguration)
    console.log('📊 Criando configuração de trabalho com cálculos precisos...');

    // Definir configuração padrão: segunda a sexta-feira, 8 horas por dia
    const defaultWorkConfig: WorkingDaysConfig = {
      workMonday: true,
      workTuesday: true,
      workWednesday: true,
      workThursday: true,
      workFriday: true,
      workSaturday: false,
      workSunday: false,
      hoursPerDay: 8.0,
    };

    // Calcular campos derivados usando o algoritmo preciso
    const workCalculations = calculateWorkingDays(defaultWorkConfig);

    await prisma.workConfiguration.create({
      data: {
        hoursPerDay: 8.0,
        daysPerMonth: 22.0, // mantido para compatibilidade
        hourlyRate: 25.0,
        highCostAlertThreshold: 50.0,
        currencySymbol: 'R$',
        enableCostAlerts: true,
        enablePriceAlerts: true,
        defaultMarginPercentage: 60.0,
        priceIncreaseAlertThreshold: 20.0,
        autoCalculateMargins: true,
        businessName: 'Doces da Maria - Demo',
        // Configuração de dias da semana
        workMonday: defaultWorkConfig.workMonday,
        workTuesday: defaultWorkConfig.workTuesday,
        workWednesday: defaultWorkConfig.workWednesday,
        workThursday: defaultWorkConfig.workThursday,
        workFriday: defaultWorkConfig.workFriday,
        workSaturday: defaultWorkConfig.workSaturday,
        workSunday: defaultWorkConfig.workSunday,
        // Campos calculados precisos
        annualWorkingDays: workCalculations.annualWorkingDays,
        annualWorkingHours: workCalculations.annualWorkingHours,
        monthlyWorkingHours: workCalculations.monthlyWorkingHours,
      },
    });

    console.log(
      `✅ Configuração criada: ${
        workCalculations.annualWorkingDays
      } dias/ano, ${
        workCalculations.annualWorkingHours
      } horas/ano, ${workCalculations.monthlyWorkingHours.toFixed(1)} horas/mês`
    );

    // Inserir custos fixos
    const sampleFixedCosts = [
      {
        name: 'Aluguel da Cozinha',
        category: 'Imóvel',
        value: 1500.0,
        recurrence: 'monthly',
        description: 'Aluguel mensal do espaço de produção',
        isActive: true,
      },
      {
        name: 'Energia Elétrica',
        category: 'Utilidades',
        value: 300.0,
        recurrence: 'monthly',
        description: 'Conta de luz mensal',
        isActive: true,
      },
      {
        name: 'Gás de Cozinha',
        category: 'Utilidades',
        value: 150.0,
        recurrence: 'monthly',
        description: 'Gás para fogão e forno',
        isActive: true,
      },
      {
        name: 'Seguro Empresarial',
        category: 'Seguros',
        value: 800.0,
        recurrence: 'yearly',
        description: 'Seguro anual da empresa',
        isActive: true,
      },
      {
        name: 'Contador',
        category: 'Serviços',
        value: 400.0,
        recurrence: 'monthly',
        description: 'Serviços contábeis mensais',
        isActive: true,
      },
    ];

    for (const fixedCost of sampleFixedCosts) {
      await prisma.fixedCost.create({
        data: {
          name: fixedCost.name,
          category: fixedCost.category,
          value: fixedCost.value,
          recurrence: fixedCost.recurrence,
          description: fixedCost.description,
          isActive: fixedCost.isActive,
        },
      });
    }

    // Criar usuário admin padrão
    await userService.createAdminUser();

    console.log('✓ Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    console.log('Seed finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  });

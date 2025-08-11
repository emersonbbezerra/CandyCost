import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './db';
import { userService } from './services/userService';

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
        unit: 'unidade',
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
        unit: 'litro',
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

    // Produtos de exemplo
    const sampleProducts = [
      {
        name: 'Brigadeiro Gourmet',
        category: 'Doces',
        description: 'Brigadeiro cremoso de chocolate',
        isAlsoIngredient: true,
        marginPercentage: 70,
        preparationTimeMinutes: 30,
      },
      {
        name: 'Cupcake de Baunilha',
        category: 'Bolos',
        description: 'Cupcake com cobertura de baunilha',
        isAlsoIngredient: false,
        marginPercentage: 60,
        preparationTimeMinutes: 45,
      },
      {
        name: 'Trufa de Chocolate Branco',
        category: 'Doces',
        description: 'Trufa artesanal de chocolate branco',
        isAlsoIngredient: false,
        marginPercentage: 65,
        preparationTimeMinutes: 60,
      },
      {
        name: 'Torta de Chocolate',
        category: 'Tortas Tradicionais',
        description: 'Torta de chocolate com cobertura',
        isAlsoIngredient: false,
        marginPercentage: 35,
        preparationTimeMinutes: 120,
      },
      {
        name: 'Bolo de Morango',
        category: 'Bolos',
        description: 'Bolo com recheio de morango e chantilly',
        isAlsoIngredient: false,
        marginPercentage: 40,
        preparationTimeMinutes: 90,
      },
      {
        name: 'Cheesecake de Frutas Vermelhas',
        category: 'Tortas Especiais',
        description: 'Cheesecake cremoso com frutas',
        isAlsoIngredient: false,
        marginPercentage: 45,
        preparationTimeMinutes: 180,
      },
      {
        name: 'Açaí na Tigela Premium',
        category: 'Sobremesas',
        description: 'Açaí com granola, frutas e mel',
        isAlsoIngredient: false,
        marginPercentage: 25,
        preparationTimeMinutes: 10,
      },
      {
        name: 'Brownie com Nozes',
        category: 'Doces',
        description: 'Brownie denso com nozes caramelizadas',
        isAlsoIngredient: false,
        marginPercentage: 20,
        preparationTimeMinutes: 50,
      },
      {
        name: 'Torta Holandesa',
        category: 'Tortas Especiais',
        description: 'Torta com creme e chocolate premium',
        isAlsoIngredient: false,
        marginPercentage: 15,
        preparationTimeMinutes: 150,
      },
      {
        name: 'Beijinho Gourmet',
        category: 'Doces',
        description: 'Beijinho artesanal com coco premium',
        isAlsoIngredient: false,
        marginPercentage: 200,
        preparationTimeMinutes: 25,
      },
      {
        name: 'Fatia de Bolo Red Velvet',
        category: 'Fatias',
        description: 'Fatia individual de bolo red velvet',
        isAlsoIngredient: false,
        marginPercentage: 80,
        preparationTimeMinutes: 5,
      },
      {
        name: 'Calda de Chocolate',
        category: 'Caldas',
        description: 'Calda de chocolate cremosa',
        isAlsoIngredient: true,
        marginPercentage: 100,
        preparationTimeMinutes: 15,
      },
      {
        name: 'Recheio de Brigadeiro',
        category: 'Recheios',
        description: 'Recheio cremoso de brigadeiro',
        isAlsoIngredient: true,
        marginPercentage: 120,
        preparationTimeMinutes: 20,
      },
      {
        name: 'Cobertura de Ganache',
        category: 'Coberturas',
        description: 'Cobertura de ganache premium',
        isAlsoIngredient: true,
        marginPercentage: 90,
        preparationTimeMinutes: 25,
      },
      {
        name: 'Caseirinho de Chocolate',
        category: 'Caseirinhos',
        description: 'Doce caseiro de chocolate',
        isAlsoIngredient: false,
        marginPercentage: 150,
        preparationTimeMinutes: 40,
      },
    ];

    // Inserir produtos
    const insertedProducts = [];
    for (const product of sampleProducts) {
      const inserted = await prisma.product.create({
        data: {
          name: product.name,
          category: product.category,
          description: product.description,
          isAlsoIngredient: product.isAlsoIngredient,
          marginPercentage: product.marginPercentage,
          preparationTimeMinutes: product.preparationTimeMinutes,
        },
      });
      insertedProducts.push(inserted);
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
        unit: 'unidade',
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
        unit: 'unidade',
      },
      {
        productIndex: 4,
        ingredientIndex: 10,
        productIngredientIndex: null,
        quantity: '0.3',
        unit: 'litro',
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
        unit: 'unidade',
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
        unit: 'unidade',
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
        unit: 'unidade',
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
        oldPrice: 10.0,
        newPrice: 12.5,
        changeType: 'manual',
        description: 'Ajuste de preço por fornecedor',
        ingredientId: insertedIngredients[0].id,
      },
      {
        itemType: 'product',
        itemName: 'Brigadeiro Gourmet',
        oldPrice: 2.0,
        newPrice: 2.5,
        changeType: 'ingredient_update',
        description: 'Atualização após mudança no preço do chocolate',
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
    await prisma.workConfiguration.create({
      data: {
        hoursPerDay: 8.0,
        daysPerMonth: 22.0,
        hourlyRate: 25.0,
        highCostAlertThreshold: 50.0,
        currencySymbol: 'R$',
      },
    });

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

import { Request, Response } from 'express';
import { prisma } from '../db';
import { priceHistoryService } from '../services/priceHistoryService';

export const getCostEvolution = async (req: Request, res: Response) => {
  try {
    const { productId, months = 6 } = req.query;

    let history: any[] = [];

    if (productId && productId !== 'general') {
      // Dados específicos do produto
      history = await priceHistoryService.getPriceHistory(
        undefined,
        productId as string
      );
    } else {
      // Dados gerais (todos os produtos)
      history = await priceHistoryService.getPriceHistory();
      history = history.filter((item) => item.productId); // Apenas produtos
    }

    // Agrupar por mês e calcular médias
    const monthlyData = history.reduce((acc: any, item) => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          costs: [],
          date: date,
        };
      }

      acc[monthKey].costs.push(parseFloat(item.newPrice));
      return acc;
    }, {});

    // Converter para array e ordenar por data
    const evolutionData = Object.values(monthlyData)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
      .slice(-parseInt(months as string)) // Últimos N meses
      .map((data: any) => ({
        month: data.month,
        cost:
          data.costs.reduce((sum: number, cost: number) => sum + cost, 0) /
          data.costs.length,
        changes: data.costs.length,
      }));

    res.json(evolutionData);
  } catch (error) {
    console.error('Error getting cost evolution:', error);
    res.status(500).json({ message: 'Erro ao buscar evolução de custos' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { type = 'product', category = 'all' } = req.query;

    // Get ingredient count
    const ingredientCount = await prisma.ingredient.count();

    // Get product count
    const productCount = await prisma.product.count();

    const products = await prisma.product.findMany();

    // Filter products by category if specified
    const filteredProducts =
      category === 'all'
        ? products
        : products.filter((p) => p.category === category);

    // Calculate profit margins (using marginPercentage from database)
    const profitData = filteredProducts.map((product) => ({
      profitMargin: product.marginPercentage,
      category: product.category,
    }));

    let avgProfitMargin = 0;
    let categoryBreakdown: any[] = [];

    if (type === 'category') {
      // Calculate average profit by category
      const categoryGroups = profitData.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item.profitMargin);
        return acc;
      }, {} as Record<string, number[]>);

      // Create category breakdown for frontend
      categoryBreakdown = Object.entries(categoryGroups).map(
        ([cat, margins]) => ({
          category: cat,
          avgMargin: margins.reduce((a, b) => a + b, 0) / margins.length,
          productCount: margins.length,
        })
      );

      if (category === 'all') {
        // General average across all categories
        const categoryAverages = Object.values(categoryGroups).map(
          (margins: number[]) =>
            margins.reduce((a: number, b: number) => a + b, 0) / margins.length
        );
        avgProfitMargin =
          categoryAverages.length > 0
            ? categoryAverages.reduce((a: number, b: number) => a + b, 0) /
              categoryAverages.length
            : 0;
      } else {
        // Average for specific category
        const categoryKey = String(category);
        const categoryMargins = categoryGroups[categoryKey] || [];
        avgProfitMargin =
          categoryMargins.length > 0
            ? categoryMargins.reduce((a: number, b: number) => a + b, 0) /
              categoryMargins.length
            : 0;
      }
    } else {
      // Calculate average profit by product
      const margins = profitData.map((item) => item.profitMargin);
      avgProfitMargin =
        margins.length > 0
          ? margins.reduce((a, b) => a + b, 0) / margins.length
          : 0;
    }

    // Today's changes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChanges = await prisma.priceHistory.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Get unique categories for frontend
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category))
    ).sort();

    res.json({
      totalIngredients: ingredientCount,
      totalProducts: productCount,
      avgProfitMargin: avgProfitMargin.toFixed(1),
      availableCategories: uniqueCategories,
      todayChanges,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};

export const getRecentUpdates = async (req: Request, res: Response) => {
  // Strong cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
    'Last-Modified': new Date().toUTCString(),
    ETag: Math.random().toString(36),
  });

  try {
    // Debug: vamos ver o que tem no banco de ingredientes
    console.log('🔍 Debugando histórico de ingredientes...');

    // Primeira verificação: quantos registros de ingredientes existem no total?
    const totalIngredientHistory = await prisma.priceHistory.count({
      where: { ingredientId: { not: null } },
    });
    console.log(
      '📊 Total de registros de ingredientes no banco:',
      totalIngredientHistory
    );

    // Segunda verificação: quais são os últimos registros de ingredientes?
    const allIngredientHistory = await prisma.priceHistory.findMany({
      where: { ingredientId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10, // Pegar 10 para debug
      include: {
        ingredient: true,
      },
    });

    console.log(
      '🥄 Últimos registros de ingredientes:',
      allIngredientHistory.map((h) => ({
        id: h.id,
        ingredientName: h.ingredient?.name,
        oldPrice: h.oldPrice,
        newPrice: h.newPrice,
        createdAt: h.createdAt,
        changeType: h.changeType,
      }))
    );

    // Abordagem completamente separada: consulta direta por ingredientes como sugerido
    const [ingredientUpdates, allProductUpdates, fixedCostUpdates] =
      await Promise.all([
        // Consulta direta e específica para ingredientes - garantia total
        prisma.priceHistory.findMany({
          where: {
            ingredientId: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Pegar os 5 mais recentes de ingredientes
          include: {
            ingredient: true,
            product: true,
          },
        }),
        // Consulta unificada para TODOS os produtos (diretos e indiretos)
        prisma.priceHistory.findMany({
          where: {
            productId: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Pegar mais para ter dados suficientes após deduplicação
          include: {
            ingredient: true,
            product: true,
          },
        }),
        // Consulta direta para custos fixos
        prisma.priceHistory.findMany({
          where: {
            itemType: 'fixed_cost',
            productId: null,
            ingredientId: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Ajustado para 5 custos fixos
          include: {
            ingredient: true,
            product: true,
          },
        }),
      ]);

    // Format ingredient updates
    const enrichedIngredientUpdates = ingredientUpdates.map((update) => ({
      id: update.id,
      type: 'ingredient' as const,
      name: update.ingredient?.name || 'Ingrediente desconhecido',
      itemId: update.ingredientId,
      oldPrice: parseFloat(String(update.oldPrice)) || 0,
      newPrice: parseFloat(String(update.newPrice)) || 0,
      unit: update.ingredient?.unit || undefined,
      changeType: update.changeType,
      createdAt: update.createdAt,
    }));

    // Process ALL product updates (unified approach)
    // First, deduplicate by product to keep only the most recent update per product
    const productMap = new Map<string, any>();

    allProductUpdates.forEach((update) => {
      const productId = update.productId;
      if (productId) {
        const existing = productMap.get(productId);
        if (
          !existing ||
          new Date(update.createdAt) > new Date(existing.createdAt)
        ) {
          productMap.set(productId, update);
        }
      }
    });

    // Convert to array, sort by date, and take the 5 most recent
    const enrichedProductUpdates = Array.from(productMap.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((update) => ({
        id: update.id,
        type:
          update.changeType?.includes('fixed_cost') ||
          update.changeType === 'work_config_impact'
            ? 'product_indirect'
            : ('product' as const),
        name: update.product?.name || 'Produto desconhecido',
        itemId: update.productId,
        oldPrice: update.oldPrice,
        newPrice: update.newPrice,
        unit: update.product?.yieldUnit || undefined,
        changeType: update.changeType,
        createdAt: update.createdAt,
      }));

    // Format fixed cost updates

    const enrichedFixedCostUpdates = fixedCostUpdates.map((update) => ({
      id: update.id,
      type: 'fixed_cost' as const,
      name: update.itemName || 'Custo Fixo',
      itemId: null,
      oldPrice: update.oldPrice,
      newPrice: update.newPrice,
      unit: undefined,
      changeType: update.changeType,
      createdAt: update.createdAt,
    }));

    // Debug: Log dos custos fixos encontrados
    console.log('🔧 Fixed Cost Updates encontrados:');
    fixedCostUpdates.forEach((update) => {
      console.log(
        `  - ${update.itemName}: ${update.changeType} (${new Date(
          update.createdAt
        ).toLocaleString()})`
      );
    });
    console.log(
      `📊 Total de fixed cost updates: ${enrichedFixedCostUpdates.length}`
    );

    // Separate products by type for frontend compatibility
    const directProducts = enrichedProductUpdates.filter(
      (p) => p.type === 'product'
    );
    const indirectProducts = enrichedProductUpdates.filter(
      (p) => p.type === 'product_indirect'
    );

    const responseData = {
      ingredientUpdates: enrichedIngredientUpdates,
      productUpdates: directProducts,
      productIndirectUpdates: indirectProducts,
      fixedCostUpdates: enrichedFixedCostUpdates,
    };

    // Log para debug - mostrar quantos registros cada categoria tem
    console.log('📊 Dashboard recent updates:', {
      ingredientCount: enrichedIngredientUpdates.length,
      directProductCount: directProducts.length,
      indirectProductCount: indirectProducts.length,
      fixedCostCount: enrichedFixedCostUpdates.length,
      totalProductUpdates: enrichedProductUpdates.length,
      ingredientNames: enrichedIngredientUpdates.map((u) => u.name).join(', '),
      allProductNames: enrichedProductUpdates.map((u) => u.name).join(', '),
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching recent updates:', error);
    res.status(500).json({ message: 'Erro ao buscar atualizações recentes' });
  }
};

/**
 * Endpoint específico APENAS para atualizações de ingredientes
 * Independente de qualquer outra lógica de invalidação
 */
export const getIngredientUpdates = async (req: Request, res: Response) => {
  // Cache headers muito específicos
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
    'Last-Modified': new Date().toUTCString(),
    ETag: `ingredient-${Date.now()}`,
  });

  try {
    console.log('🥄 Fetching ingredient updates ONLY');

    // Query ultra-específica - APENAS ingredientes, nada mais
    const ingredientUpdates = await prisma.priceHistory.findMany({
      where: {
        ingredientId: { not: null }, // APENAS registros de ingredientes
        ingredient: { isNot: null }, // Garantir que o ingrediente existe
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Pegar mais registros para garantir
      include: {
        ingredient: true,
      },
    });

    const enrichedIngredientUpdates = ingredientUpdates.map((update) => ({
      id: update.id,
      type: 'ingredient' as const,
      name: update.ingredient?.name || 'Ingrediente desconhecido',
      itemId: update.ingredientId,
      oldPrice: update.oldPrice,
      newPrice: update.newPrice,
      unit: update.ingredient?.unit || undefined,
      changeType: update.changeType,
      createdAt: update.createdAt,
    }));

    console.log(
      '🥄 Found ingredient updates:',
      enrichedIngredientUpdates.length
    );

    res.json({
      ingredientUpdates: enrichedIngredientUpdates,
    });
  } catch (error) {
    console.error('Error fetching ingredient updates:', error);
    res
      .status(500)
      .json({ message: 'Erro ao buscar atualizações de ingredientes' });
  }
};

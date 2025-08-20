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
    // Buscar últimos registros por categoria separadamente para garantir diversidade
    const [
      recentIngredientUpdates,
      recentProductUpdates,
      recentFixedCostUpdates,
    ] = await Promise.all([
      // Ingredientes
      prisma.priceHistory.findMany({
        where: { ingredientId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          ingredient: true,
          product: true,
        },
      }),
      // Produtos
      prisma.priceHistory.findMany({
        where: { productId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          ingredient: true,
          product: true,
        },
      }),
      // Custos fixos
      prisma.priceHistory.findMany({
        where: {
          itemType: 'fixed_cost',
          productId: null,
          ingredientId: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          ingredient: true,
          product: true,
        },
      }),
    ]);

    // Format ingredient updates
    const enrichedIngredientUpdates = recentIngredientUpdates.map((update) => ({
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

    // Format product updates
    const enrichedProductUpdates = recentProductUpdates.map((update) => ({
      id: update.id,
      type: 'product' as const,
      name: update.product?.name || 'Produto desconhecido',
      itemId: update.productId,
      oldPrice: update.oldPrice,
      newPrice: update.newPrice,
      unit: update.product?.yieldUnit || undefined,
      changeType: update.changeType,
      createdAt: update.createdAt,
    }));

    const enrichedFixedCostUpdates = recentFixedCostUpdates.map((update) => ({
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

    const responseData = {
      ingredientUpdates: enrichedIngredientUpdates,
      productUpdates: enrichedProductUpdates,
      fixedCostUpdates: enrichedFixedCostUpdates,
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching recent updates:', error);
    res.status(500).json({ message: 'Erro ao buscar atualizações recentes' });
  }
};

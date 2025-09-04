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

    // Buscar contagem de ingredientes
    const ingredientCount = await prisma.ingredient.count();

    // Buscar contagem de produtos
    const productCount = await prisma.product.count();

    const products = await prisma.product.findMany();

    // Filtrar produtos por categoria se especificado
    const filteredProducts =
      category === 'all'
        ? products
        : products.filter((p) => p.category === category);

    // Calcular margens de lucro (usando marginPercentage do banco de dados)
    const profitData = filteredProducts.map((product) => ({
      profitMargin: product.marginPercentage,
      category: product.category,
    }));

    let avgProfitMargin = 0;
    let categoryBreakdown: any[] = [];

    if (type === 'category') {
      // Calcular média de lucro por categoria
      const categoryGroups = profitData.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item.profitMargin);
        return acc;
      }, {} as Record<string, number[]>);

      // Criar detalhamento de categorias para o frontend
      categoryBreakdown = Object.entries(categoryGroups).map(
        ([cat, margins]) => ({
          category: cat,
          avgMargin: margins.reduce((a, b) => a + b, 0) / margins.length,
          productCount: margins.length,
        })
      );

      if (category === 'all') {
        // Média geral entre todas as categorias
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
        // Média para categoria específica
        const categoryKey = String(category);
        const categoryMargins = categoryGroups[categoryKey] || [];
        avgProfitMargin =
          categoryMargins.length > 0
            ? categoryMargins.reduce((a: number, b: number) => a + b, 0) /
              categoryMargins.length
            : 0;
      }
    } else {
      // Calcular média de lucro por produto
      const margins = profitData.map((item) => item.profitMargin);
      avgProfitMargin =
        margins.length > 0
          ? margins.reduce((a, b) => a + b, 0) / margins.length
          : 0;
    }

    // Mudanças de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChanges = await prisma.priceHistory.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Buscar categorias únicas para o frontend
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
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};

export const getRecentUpdates = async (req: Request, res: Response) => {
  // Cabeçalhos anti-cache para garantir dados atualizados
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
    'Last-Modified': new Date().toUTCString(),
    ETag: Math.random().toString(36),
  });

  try {
    // Abordagem direta: consultar por tipo de item separadamente
    const [ingredientUpdates, allProductUpdates, fixedCostUpdates] =
      await Promise.all([
        // Consulta específica para ingredientes
        prisma.priceHistory.findMany({
          where: {
            ingredientId: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            ingredient: true,
            product: true,
          },
        }),
        // Consulta para TODOS os produtos (diretos e indiretos)
        prisma.priceHistory.findMany({
          where: {
            productId: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            ingredient: true,
            product: true,
          },
        }),
        // Consulta para custos fixos
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

    // Formatar atualizações de ingredientes
    const enrichedIngredientUpdates = ingredientUpdates.map((update) => {
      // Analisar dados de contexto se disponível
      let contextData = null;
      let changeReason = update.description;

      try {
        if (update.description && update.description.startsWith('{')) {
          const parsed = JSON.parse(update.description);
          contextData = parsed.context;
          changeReason = parsed.reason;
        }
      } catch (e) {
        // Se não conseguir fazer parse, usar description normalmente
      }

      return {
        id: update.id,
        type: 'ingredient' as const,
        name: update.ingredient?.name || 'Ingrediente desconhecido',
        itemId: update.ingredientId,
        oldPrice: parseFloat(String(update.oldPrice)) || 0,
        newPrice: parseFloat(String(update.newPrice)) || 0,
        unit: update.ingredient?.unit || undefined,
        changeType: update.changeType,
        createdAt: update.createdAt,
        changeReason,
        contextData,
      };
    });

    // Processar TODAS as atualizações de produtos (abordagem unificada)
    // Primeiro, deduplificar por produto para manter apenas a atualização mais recente
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

    // Converter para array, ordenar por data e pegar os 5 mais recentes
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

    // Formatar atualizações de custos fixos
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

    // Separar produtos por tipo para compatibilidade do frontend
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

    res.json(responseData);
  } catch (error) {
    console.error('Erro ao buscar atualizações recentes:', error);
    res.status(500).json({ message: 'Erro ao buscar atualizações recentes' });
  }
};

/**
 * Endpoint específico APENAS para atualizações de ingredientes
 * Independente de qualquer outra lógica
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
    // Consulta ultra-específica - APENAS ingredientes
    const ingredientUpdates = await prisma.priceHistory.findMany({
      where: {
        ingredientId: { not: null }, // APENAS registros de ingredientes
        ingredient: { isNot: null }, // Garantir que o ingrediente existe
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        ingredient: true,
      },
    });

    const enrichedIngredientUpdates = ingredientUpdates.map((update) => {
      // Analisar dados de contexto se disponível
      let contextData = null;
      let changeReason = update.description;

      try {
        if (update.description && update.description.startsWith('{')) {
          const parsed = JSON.parse(update.description);
          contextData = parsed.context;
          changeReason = parsed.reason;
        }
      } catch (e) {
        // Se não conseguir fazer parse, usar description normalmente
      }

      return {
        id: update.id,
        type: 'ingredient' as const,
        name: update.ingredient?.name || 'Ingrediente desconhecido',
        itemId: update.ingredientId,
        oldPrice: update.oldPrice,
        newPrice: update.newPrice,
        unit: update.ingredient?.unit || undefined,
        changeType: update.changeType,
        createdAt: update.createdAt,
        changeReason,
        contextData,
      };
    });

    res.json({
      ingredientUpdates: enrichedIngredientUpdates,
    });
  } catch (error) {
    console.error('Erro ao buscar atualizações de ingredientes:', error);
    res
      .status(500)
      .json({ message: 'Erro ao buscar atualizações de ingredientes' });
  }
};

import { Request, Response } from "express";
import { priceHistoryService } from "../services/priceHistoryService";
import { productService } from "../services/productService";

export const getCostEvolution = async (req: Request, res: Response) => {
  try {
    const { productId, months = 6 } = req.query;

    let history: any[] = [];

    if (productId && productId !== "general") {
      // Dados específicos do produto
      history = await priceHistoryService.getPriceHistory(undefined, parseInt(productId as string));
    } else {
      // Dados gerais (todos os produtos)
      history = await priceHistoryService.getPriceHistory();
      history = history.filter(item => item.productId); // Apenas produtos
    }

    // Agrupar por mês e calcular médias
    const monthlyData = history.reduce((acc: any, item) => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          costs: [],
          date: date
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
        cost: data.costs.reduce((sum: number, cost: number) => sum + cost, 0) / data.costs.length,
        changes: data.costs.length
      }));

    res.json(evolutionData);
  } catch (error) {
    console.error("Error getting cost evolution:", error);
    res.status(500).json({ message: "Erro ao buscar evolução de custos" });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { type = 'product', category = 'all' } = req.query;
    
    const ingredients = await productService.getIngredients();
    const products = await productService.getProducts();
    const history = await priceHistoryService.getPriceHistory();

    // Filter products by category if specified
    const filteredProducts = category === 'all' ? products : products.filter(p => p.category === category);

    // Calculate profit margins
    const profitMarginsPromises = filteredProducts.map(async (product) => {
      try {
        const cost = await productService.calculateProductCost(product.id);
        const marginPercentage = product.marginPercentage ? parseFloat(product.marginPercentage) : 60;
        const profitMargin = marginPercentage;
        return { 
          profitMargin, 
          category: product.category 
        };
      } catch {
        return { 
          profitMargin: 0, 
          category: product.category 
        };
      }
    });

    const profitData = await Promise.all(profitMarginsPromises);
    
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
      categoryBreakdown = Object.entries(categoryGroups).map(([cat, margins]) => ({
        category: cat,
        avgMargin: margins.reduce((a, b) => a + b, 0) / margins.length,
        productCount: margins.length
      }));

      if (category === 'all') {
        // General average across all categories
        const categoryAverages = Object.values(categoryGroups).map(margins => 
          margins.reduce((a, b) => a + b, 0) / margins.length
        );
        avgProfitMargin = categoryAverages.length > 0 
          ? categoryAverages.reduce((a, b) => a + b, 0) / categoryAverages.length 
          : 0;
      } else {
        // Average for specific category
        const categoryMargins = categoryGroups[category] || [];
        avgProfitMargin = categoryMargins.length > 0
          ? categoryMargins.reduce((a, b) => a + b, 0) / categoryMargins.length
          : 0;
      }
    } else {
      // Calculate average profit by product
      const margins = profitData.map(item => item.profitMargin);
      avgProfitMargin = margins.length > 0 
        ? margins.reduce((a, b) => a + b, 0) / margins.length 
        : 0;
    }

    // Today's changes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChanges = history.filter(h => h.createdAt >= today).length;

    // Get unique categories for frontend
    const uniqueCategories = [...new Set(products.map(p => p.category))].sort();

    res.json({
      totalIngredients: ingredients.length,
      totalProducts: filteredProducts.length,
      avgProfitMargin: avgProfitMargin.toFixed(1),
      profitType: type,
      selectedCategory: category,
      categoryBreakdown,
      availableCategories: uniqueCategories,
      todayChanges,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
};

export const getRecentUpdates = async (req: Request, res: Response) => {
  // Strong cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': Math.random().toString(36)
  });

  try {
    // Force fresh data by bypassing any potential caching
    const ingredients = await productService.getIngredients();
    const products = await productService.getProducts();

    // Buscar TODO o histórico de preços com debugging
    console.log("🔍 Fetching ALL price history at", new Date().toISOString());
    const allHistory = await priceHistoryService.getPriceHistory();
    console.log("📊 Total history entries found:", allHistory.length);

    // Log recent entries for debugging
    const recentEntries = allHistory
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    console.log("🔥 Most recent 10 entries:", recentEntries.map(h => ({
      id: h.id,
      productId: h.productId,
      ingredientId: h.ingredientId,
      createdAt: h.createdAt,
      changeReason: h.changeReason
    })));

    // Filtrar e ordenar atualizações de ingredientes
    const ingredientUpdatesFiltered = allHistory
      .filter(update => update.ingredientId !== null && update.ingredientId !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3); // Limitar a 3 ingredientes

    // Filtrar e ordenar atualizações de produtos  
    const productUpdatesFiltered = allHistory
      .filter(update => update.productId !== null && update.productId !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3); // Limitar a 3 produtos

    // Criar mapas para busca rápida de nomes
    const ingredientMap = new Map(ingredients.map(i => [i.id, i.name]));
    const productMap = new Map(products.map(p => [p.id, p.name]));

    // Enriquecer atualizações com nomes
    const enrichedIngredientUpdates = ingredientUpdatesFiltered.map(update => ({
      ...update,
      name: ingredientMap.get(update.ingredientId!) || "Ingrediente desconhecido"
    }));

    const enrichedProductUpdates = productUpdatesFiltered.map(update => ({
      ...update,
      name: productMap.get(update.productId!) || "Produto desconhecido"
    }));

    console.log("✅ Recent product updates found:", enrichedProductUpdates.length);
    console.log("✅ Recent ingredient updates found:", enrichedIngredientUpdates.length);

    // Log the actual data being returned
    console.log("📤 Product updates being returned:", enrichedProductUpdates.map(u => ({
      id: u.id,
      name: u.name,
      productId: u.productId,
      createdAt: u.createdAt
    })));

    console.log("📤 Ingredient updates being returned:", enrichedIngredientUpdates.map(u => ({
      id: u.id,
      name: u.name,
      ingredientId: u.ingredientId,
      createdAt: u.createdAt
    })));

    const responseData = {
      ingredientUpdates: enrichedIngredientUpdates,
      productUpdates: enrichedProductUpdates,
      timestamp: new Date().toISOString(), // Add timestamp to prevent caching
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching recent updates:", error);
    res.status(500).json({ message: "Erro ao buscar atualizações recentes" });
  }
};
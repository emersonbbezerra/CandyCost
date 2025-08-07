import { Request, Response } from "express";
import { priceHistoryService } from "../services/priceHistoryService";
import { productService } from "../services/productService";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const ingredients = await productService.getIngredients();
    const products = await productService.getProducts();
    const history = await priceHistoryService.getPriceHistory();
    
    // Calculate average cost
    const costsPromises = products.map(async (product) => {
      try {
        const cost = await productService.calculateProductCost(product.id);
        return cost.totalCost;
      } catch {
        return 0;
      }
    });
    
    const costs = await Promise.all(costsPromises);
    const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    
    // Today's changes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChanges = history.filter(h => h.createdAt >= today).length;
    
    res.json({
      totalIngredients: ingredients.length,
      totalProducts: products.length,
      avgCost: avgCost.toFixed(2),
      todayChanges,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
};

export const getRecentUpdates = async (_req: Request, res: Response) => {
  // Disable caching for this endpoint
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const ingredients = await productService.getIngredients();
    const products = await productService.getProducts();

    // Buscar TODO o histórico de preços
    const allHistory = await priceHistoryService.getPriceHistory();

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

    console.log("Recent product updates found:", enrichedProductUpdates.length);
    console.log("Recent ingredient updates found:", enrichedIngredientUpdates.length);

    res.json({
      ingredientUpdates: enrichedIngredientUpdates,
      productUpdates: enrichedProductUpdates,
    });
  } catch (error) {
    console.error("Error fetching recent updates:", error);
    res.status(500).json({ message: "Erro ao buscar atualizações recentes" });
  }
};

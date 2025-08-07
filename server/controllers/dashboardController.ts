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

    // Buscar atualizações recentes para ingredientes e produtos separadamente
    const ingredientUpdates = await priceHistoryService.getPriceHistory();
    const productUpdates = await priceHistoryService.getPriceHistory();

    // Filtrar atualizações por ingrediente e produto
    const ingredientUpdatesFiltered = ingredientUpdates.filter(update => update.ingredientId !== null);
    const productUpdatesFiltered = productUpdates.filter(update => update.productId !== null);

    // Enriquecer atualizações com nomes
    const ingredientMap = new Map(ingredients.map(i => [i.id, i.name]));
    const productMap = new Map(products.map(p => [p.id, p.name]));

    const enrichedIngredientUpdates = ingredientUpdatesFiltered.map(update => ({
      ...update,
      name: ingredientMap.get(update.ingredientId!) || "Ingrediente desconhecido"
    }));

    const enrichedProductUpdates = productUpdatesFiltered.map(update => ({
      ...update,
      name: productMap.get(update.productId!) || "Produto desconhecido"
    }));

    // Ordenar por data decrescente e limitar a 5
    enrichedIngredientUpdates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    enrichedProductUpdates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      ingredientUpdates: enrichedIngredientUpdates.slice(0, 5),
      productUpdates: enrichedProductUpdates.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar atualizações recentes" });
  }
};

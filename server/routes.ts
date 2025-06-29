import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIngredientSchema, insertProductSchema, insertRecipeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ingredients routes
  app.get("/api/ingredients", async (_req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ingredientes" });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredient = await storage.getIngredient(id);
      if (!ingredient) {
        return res.status(404).json({ message: "Ingrediente não encontrado" });
      }
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ingrediente" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const data = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(data);
      res.status(201).json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar ingrediente" });
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertIngredientSchema.partial().parse(req.body);
      const ingredient = await storage.updateIngredient(id, data);
      
      // Get products affected by this ingredient change
      const affectedProducts = await storage.getProductsUsingIngredient(id);
      
      res.json({ ingredient, affectedProducts });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar ingrediente" });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIngredient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar ingrediente" });
    }
  });

  // Products routes
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      const productsWithCosts = await Promise.all(
        products.map(async (product) => {
          try {
            const cost = await storage.calculateProductCost(product.id);
            return { ...product, cost };
          } catch {
            return { ...product, cost: null };
          }
        })
      );
      res.json(productsWithCosts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductWithRecipes(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      try {
        const cost = await storage.calculateProductCost(id);
        res.json({ ...product, cost });
      } catch {
        res.json({ ...product, cost: null });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, data);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar produto" });
    }
  });

  // Recipes routes
  app.post("/api/products/:id/recipes", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const recipes = req.body; // Simplified validation
      
      // Delete existing recipes for this product
      await storage.deleteRecipesByProduct(productId);
      
      // Create new recipes with proper validation
      const createdRecipes = await Promise.all(
        recipes.map((recipe: any) => storage.createRecipe({ 
          productId,
          ingredientId: recipe.ingredientId,
          productIngredientId: recipe.productIngredientId,
          quantity: recipe.quantity,
          unit: recipe.unit
        }))
      );
      
      res.json(createdRecipes);
    } catch (error) {
      console.error("Erro ao salvar receitas:", error);
      res.status(500).json({ message: "Erro ao salvar receitas" });
    }
  });

  // Price history routes
  app.get("/api/price-history", async (req, res) => {
    try {
      const ingredientId = req.query.ingredientId ? parseInt(req.query.ingredientId as string) : undefined;
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      
      const history = await storage.getPriceHistory(ingredientId, productId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar histórico de preços" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      const products = await storage.getProducts();
      const history = await storage.getPriceHistory();
      
      // Calculate average cost
      const costsPromises = products.map(async (product) => {
        try {
          const cost = await storage.calculateProductCost(product.id);
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
  });

  const httpServer = createServer(app);
  return httpServer;
}

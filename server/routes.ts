import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIngredientSchema, insertProductSchema, insertRecipeSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin, userService } from "./auth";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Create admin user on startup
  try {
    await userService.createAdminUser();
    console.log("✓ Admin user created/verified");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  // Authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Credenciais inválidas' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Erro ao fazer login' });
        }
        return res.json({
          message: 'Login realizado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    })(req, res, next);
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const registerSchema = z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
        firstName: z.string().min(1, 'Nome é obrigatório'),
        lastName: z.string().optional(),
      });

      const { email, password, firstName, lastName } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }

      // Create new user
      const newUser = await userService.createUser({
        email,
        password,
        firstName,
        lastName,
        role: 'user'
      });

      // Log the user in
      req.logIn(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Usuário criado, mas erro ao fazer login' });
        }
        return res.status(201).json({
          message: 'Usuário criado com sucesso',
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role
          }
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Register error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao fazer logout' });
      }
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });

  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  });

  // Ingredients routes (protected)
  app.get("/api/ingredients", isAuthenticated, async (_req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ingredientes" });
    }
  });

  app.get("/api/ingredients/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/ingredients", isAuthenticated, async (req, res) => {
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

  app.put("/api/ingredients/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/ingredients/:id", isAuthenticated, async (req, res) => {
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

  // Reports endpoint
  app.get("/api/reports", async (_req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      const products = await storage.getProducts();
      
      // Calculate product costs
      const costsPromises = products.map(async (product) => {
        try {
          const cost = await storage.calculateProductCost(product.id);
          return { product, cost };
        } catch {
          return { product, cost: { productId: product.id, totalCost: 0, suggestedPrice: 0, margin: 0 } };
        }
      });
      
      const productCosts = await Promise.all(costsPromises);
      
      // Lucratividade analysis
      const profitabilityAnalysis = productCosts.map(({ product, cost }) => {
        const profitMargin = cost.suggestedPrice > 0 
          ? ((cost.suggestedPrice - cost.totalCost) / cost.suggestedPrice) * 100 
          : 0;
        return { product, cost, profitMargin };
      }).sort((a, b) => b.profitMargin - a.profitMargin);

      // Critical ingredients analysis
      const ingredientUsage = new Map<number, number>();
      const recipesPromises = products.map(async (product) => {
        try {
          const recipes = await storage.getRecipesByProduct(product.id);
          recipes.forEach(recipe => {
            if (recipe.ingredientId) {
              ingredientUsage.set(recipe.ingredientId, (ingredientUsage.get(recipe.ingredientId) || 0) + 1);
            }
          });
        } catch {
          // Skip if no recipes found
        }
      });
      
      await Promise.all(recipesPromises);

      const criticalIngredients = ingredients
        .map(ingredient => {
          const costPerUnit = parseFloat(ingredient.price) / parseFloat(ingredient.quantity);
          const usageCount = ingredientUsage.get(ingredient.id) || 0;
          return {
            ingredient,
            usageCount,
            totalImpact: usageCount * costPerUnit
          };
        })
        .filter(item => item.usageCount > 0)
        .sort((a, b) => b.totalImpact - a.totalImpact);

      // Category distribution
      const categoryMap = new Map<string, { count: number; totalCost: number }>();
      productCosts.forEach(({ product, cost }) => {
        const current = categoryMap.get(product.category) || { count: 0, totalCost: 0 };
        categoryMap.set(product.category, {
          count: current.count + 1,
          totalCost: current.totalCost + cost.totalCost
        });
      });

      const categoryDistribution = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        avgCost: data.totalCost / data.count
      }));

      // Complex recipes analysis
      const complexRecipesPromises = products.map(async (product) => {
        try {
          const recipes = await storage.getRecipesByProduct(product.id);
          const hasProductIngredients = recipes.some(recipe => recipe.productIngredientId);
          return {
            product,
            hasProductIngredients,
            ingredientCount: recipes.length
          };
        } catch {
          return {
            product,
            hasProductIngredients: false,
            ingredientCount: 0
          };
        }
      });

      const complexRecipes = (await Promise.all(complexRecipesPromises))
        .filter(item => item.hasProductIngredients || item.ingredientCount > 5);

      res.json({
        profitabilityAnalysis,
        criticalIngredients,
        categoryDistribution,
        complexRecipes
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar relatórios" });
    }
  });

  // Backup restore endpoint
  app.post("/api/restore-backup", async (req, res) => {
    try {
      const { backupData } = req.body;
      
      if (!backupData || !backupData.data) {
        return res.status(400).json({ message: "Dados de backup inválidos" });
      }

      const { ingredients, products, priceHistory } = backupData.data;

      // Clear existing data before restore
      await storage.clearAllData();
      
      // Restore ingredients
      if (ingredients && Array.isArray(ingredients)) {
        for (const ingredient of ingredients) {
          try {
            await storage.createIngredient({
              name: ingredient.name,
              category: ingredient.category,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              price: ingredient.cost || ingredient.price,
              brand: ingredient.supplier || ingredient.brand
            });
          } catch (error) {
            console.warn(`Erro ao restaurar ingrediente ${ingredient.name}:`, error);
          }
        }
      }

      // Restore products with recipes
      if (products && Array.isArray(products)) {
        for (const product of products) {
          try {
            const newProduct = await storage.createProduct({
              name: product.name,
              category: product.category,
              description: product.description,
              isAlsoIngredient: product.isAlsoIngredient || false,
              marginPercentage: product.marginPercentage || "30"
            });

            // Restore recipes if they exist
            if (product.recipes && Array.isArray(product.recipes)) {
              for (const recipe of product.recipes) {
                try {
                  await storage.createRecipe({
                    productId: newProduct.id,
                    ingredientId: recipe.ingredientId || null,
                    productIngredientId: recipe.productIngredientId || null,
                    quantity: recipe.quantity,
                    unit: recipe.unit || "unidade"
                  });
                } catch (error) {
                  console.warn(`Erro ao restaurar receita para produto ${product.name}:`, error);
                }
              }
            }
          } catch (error) {
            console.warn(`Erro ao restaurar produto ${product.name}:`, error);
          }
        }
      }

      // Restore price history
      if (priceHistory && Array.isArray(priceHistory)) {
        for (const history of priceHistory) {
          try {
            await storage.createPriceHistory({
              ingredientId: history.ingredientId || null,
              productId: history.productId || null,
              oldPrice: history.oldValue || history.oldPrice,
              newPrice: history.newValue || history.newPrice,
              changeReason: history.reason || history.changeReason
            });
          } catch (error) {
            console.warn(`Erro ao restaurar histórico:`, error);
          }
        }
      }

      res.json({ 
        message: "Backup restaurado com sucesso", 
        timestamp: new Date().toISOString(),
        restored: {
          ingredients: ingredients?.length || 0,
          products: products?.length || 0,
          priceHistory: priceHistory?.length || 0
        }
      });
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      res.status(500).json({ message: "Erro interno ao restaurar backup" });
    }
  });

  // Settings endpoints (protected for authenticated users, updates only for admins)
  app.get("/api/settings", isAuthenticated, async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      res.status(500).json({ message: "Erro interno ao buscar configurações" });
    }
  });

  app.put("/api/settings", isAdmin, async (req, res) => {
    try {
      const updatedSettings = await storage.updateSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      res.status(500).json({ message: "Erro interno ao salvar configurações" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

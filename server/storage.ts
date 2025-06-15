import { 
  ingredients, 
  products, 
  recipes, 
  priceHistory,
  type Ingredient, 
  type InsertIngredient,
  type Product,
  type InsertProduct,
  type Recipe,
  type InsertRecipe,
  type PriceHistory,
  type InsertPriceHistory,
  type ProductWithRecipes,
  type ProductCost
} from "@shared/schema";

export interface IStorage {
  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient>;
  deleteIngredient(id: number): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductWithRecipes(id: number): Promise<ProductWithRecipes | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Recipes
  getRecipesByProduct(productId: number): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
  deleteRecipesByProduct(productId: number): Promise<void>;

  // Price History
  getPriceHistory(ingredientId?: number, productId?: number): Promise<PriceHistory[]>;
  createPriceHistory(history: InsertPriceHistory): Promise<PriceHistory>;

  // Cost Calculations
  calculateProductCost(productId: number): Promise<ProductCost>;
  getProductsUsingIngredient(ingredientId: number): Promise<number[]>;
  getProductsUsingProduct(productIngredientId: number): Promise<number[]>;
}

export class MemStorage implements IStorage {
  private ingredients: Map<number, Ingredient>;
  private products: Map<number, Product>;
  private recipes: Map<number, Recipe>;
  private priceHistory: Map<number, PriceHistory>;
  private currentIngredientId: number;
  private currentProductId: number;
  private currentRecipeId: number;
  private currentHistoryId: number;

  constructor() {
    this.ingredients = new Map();
    this.products = new Map();
    this.recipes = new Map();
    this.priceHistory = new Map();
    this.currentIngredientId = 1;
    this.currentProductId = 1;
    this.currentRecipeId = 1;
    this.currentHistoryId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample ingredients
    const sampleIngredients: InsertIngredient[] = [
      { name: "Farinha de Trigo", category: "Farinhas", quantity: "5", unit: "kg", price: "12.50", brand: "Marca Premium" },
      { name: "Leite Condensado", category: "Laticínios", quantity: "0.395", unit: "kg", price: "4.50", brand: "Marca Top" },
      { name: "Chocolate 70%", category: "Chocolates", quantity: "1", unit: "kg", price: "45.00", brand: "Premium" },
      { name: "Açúcar Cristal", category: "Açúcares", quantity: "5", unit: "kg", price: "18.90", brand: "União" },
      { name: "Manteiga sem Sal", category: "Laticínios", quantity: "0.5", unit: "kg", price: "15.20", brand: "Elegê" },
      { name: "Ovos", category: "Outros", quantity: "30", unit: "unidade", price: "18.00", brand: "Caipira" },
    ];

    sampleIngredients.forEach((ingredient) => {
      const newIngredient: Ingredient = {
        ...ingredient,
        id: this.currentIngredientId++,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.ingredients.set(newIngredient.id, newIngredient);
    });

    // Sample products
    const sampleProducts: InsertProduct[] = [
      { name: "Brigadeiro Gourmet", category: "Doces", description: "Brigadeiro cremoso de chocolate", isAlsoIngredient: true, marginPercentage: "70" },
      { name: "Torta de Chocolate", category: "Tortas", description: "Torta de chocolate com cobertura", isAlsoIngredient: false, marginPercentage: "65" },
      { name: "Cupcake de Baunilha", category: "Cupcakes", description: "Cupcake com cobertura de baunilha", isAlsoIngredient: false, marginPercentage: "60" },
    ];

    sampleProducts.forEach((product) => {
      const newProduct: Product = {
        ...product,
        id: this.currentProductId++,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.set(newProduct.id, newProduct);
    });

    // Sample recipes
    const sampleRecipes: InsertRecipe[] = [
      // Brigadeiro Gourmet (Product ID 1)
      { productId: 1, ingredientId: 2, productIngredientId: null, quantity: "0.395", unit: "kg" }, // Leite Condensado
      { productId: 1, ingredientId: 3, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Chocolate
      { productId: 1, ingredientId: 5, productIngredientId: null, quantity: "0.05", unit: "kg" }, // Manteiga

      // Torta de Chocolate (Product ID 2)
      { productId: 2, ingredientId: 1, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Farinha
      { productId: 2, ingredientId: 3, productIngredientId: null, quantity: "0.25", unit: "kg" }, // Chocolate
      { productId: 2, ingredientId: 4, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Açúcar
      { productId: 2, ingredientId: 6, productIngredientId: null, quantity: "4", unit: "unidade" }, // Ovos
      { productId: 2, productIngredientId: 1, ingredientId: null, quantity: "0.2", unit: "kg" }, // Brigadeiro como ingrediente

      // Cupcake de Baunilha (Product ID 3)
      { productId: 3, ingredientId: 1, productIngredientId: null, quantity: "0.15", unit: "kg" }, // Farinha
      { productId: 3, ingredientId: 4, productIngredientId: null, quantity: "0.1", unit: "kg" }, // Açúcar
      { productId: 3, ingredientId: 6, productIngredientId: null, quantity: "2", unit: "unidade" }, // Ovos
    ];

    sampleRecipes.forEach((recipe) => {
      const newRecipe: Recipe = {
        ...recipe,
        id: this.currentRecipeId++,
      };
      this.recipes.set(newRecipe.id, newRecipe);
    });
  }

  async getIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    return this.ingredients.get(id);
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: this.currentIngredientId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ingredients.set(newIngredient.id, newIngredient);
    return newIngredient;
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient> {
    const existing = this.ingredients.get(id);
    if (!existing) {
      throw new Error("Ingredient not found");
    }

    const oldPrice = existing.price;
    const updated: Ingredient = {
      ...existing,
      ...ingredient,
      updatedAt: new Date(),
    };
    this.ingredients.set(id, updated);

    // Record price history if price changed
    if (ingredient.price && ingredient.price !== oldPrice) {
      await this.createPriceHistory({
        ingredientId: id,
        productId: null,
        oldPrice,
        newPrice: ingredient.price,
        changeReason: "Atualização manual",
      });
    }

    return updated;
  }

  async deleteIngredient(id: number): Promise<void> {
    this.ingredients.delete(id);
    // Also delete related recipes and price history
    for (const [key, recipe] of this.recipes.entries()) {
      if (recipe.ingredientId === id) {
        this.recipes.delete(key);
      }
    }
    for (const [key, history] of this.priceHistory.entries()) {
      if (history.ingredientId === id) {
        this.priceHistory.delete(key);
      }
    }
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductWithRecipes(id: number): Promise<ProductWithRecipes | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const productRecipes = Array.from(this.recipes.values()).filter(r => r.productId === id);
    const recipesWithDetails = await Promise.all(
      productRecipes.map(async (recipe) => {
        const ingredient = recipe.ingredientId ? await this.getIngredient(recipe.ingredientId) : undefined;
        const productIngredient = recipe.productIngredientId ? await this.getProduct(recipe.productIngredientId) : undefined;
        return { ...recipe, ingredient, productIngredient };
      })
    );

    return { ...product, recipes: recipesWithDetails };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: this.currentProductId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) {
      throw new Error("Product not found");
    }

    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
    // Also delete related recipes and price history
    for (const [key, recipe] of this.recipes.entries()) {
      if (recipe.productId === id || recipe.productIngredientId === id) {
        this.recipes.delete(key);
      }
    }
    for (const [key, history] of this.priceHistory.entries()) {
      if (history.productId === id) {
        this.priceHistory.delete(key);
      }
    }
  }

  async getRecipesByProduct(productId: number): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(r => r.productId === productId);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: this.currentRecipeId++,
    };
    this.recipes.set(newRecipe.id, newRecipe);
    return newRecipe;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe> {
    const existing = this.recipes.get(id);
    if (!existing) {
      throw new Error("Recipe not found");
    }

    const updated: Recipe = {
      ...existing,
      ...recipe,
    };
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    this.recipes.delete(id);
  }

  async deleteRecipesByProduct(productId: number): Promise<void> {
    for (const [key, recipe] of this.recipes.entries()) {
      if (recipe.productId === productId) {
        this.recipes.delete(key);
      }
    }
  }

  async getPriceHistory(ingredientId?: number, productId?: number): Promise<PriceHistory[]> {
    let history = Array.from(this.priceHistory.values());
    
    if (ingredientId) {
      history = history.filter(h => h.ingredientId === ingredientId);
    }
    
    if (productId) {
      history = history.filter(h => h.productId === productId);
    }

    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPriceHistory(history: InsertPriceHistory): Promise<PriceHistory> {
    const newHistory: PriceHistory = {
      ...history,
      id: this.currentHistoryId++,
      createdAt: new Date(),
    };
    this.priceHistory.set(newHistory.id, newHistory);
    return newHistory;
  }

  async calculateProductCost(productId: number): Promise<ProductCost> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const productRecipes = await this.getRecipesByProduct(productId);
    let totalCost = 0;

    for (const recipe of productRecipes) {
      if (recipe.ingredientId) {
        const ingredient = await this.getIngredient(recipe.ingredientId);
        if (ingredient) {
          const ingredientPricePerUnit = parseFloat(ingredient.price) / parseFloat(ingredient.quantity);
          const recipeQuantity = parseFloat(recipe.quantity);
          totalCost += ingredientPricePerUnit * recipeQuantity;
        }
      } else if (recipe.productIngredientId) {
        const productIngredientCost = await this.calculateProductCost(recipe.productIngredientId);
        const recipeQuantity = parseFloat(recipe.quantity);
        totalCost += productIngredientCost.totalCost * recipeQuantity;
      }
    }

    const marginPercentage = parseFloat(product.marginPercentage);
    const suggestedPrice = totalCost * (1 + marginPercentage / 100);
    const margin = suggestedPrice - totalCost;

    return {
      productId,
      totalCost,
      suggestedPrice,
      margin,
    };
  }

  async getProductsUsingIngredient(ingredientId: number): Promise<number[]> {
    const productIds = new Set<number>();
    
    for (const recipe of this.recipes.values()) {
      if (recipe.ingredientId === ingredientId) {
        productIds.add(recipe.productId);
      }
    }

    return Array.from(productIds);
  }

  async getProductsUsingProduct(productIngredientId: number): Promise<number[]> {
    const productIds = new Set<number>();
    
    for (const recipe of this.recipes.values()) {
      if (recipe.productIngredientId === productIngredientId) {
        productIds.add(recipe.productId);
      }
    }

    return Array.from(productIds);
  }
}

export const storage = new MemStorage();

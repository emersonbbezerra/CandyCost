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
  calculateProductCostAtPrice(productId: number, ingredientId: number, ingredientPrice: string): Promise<ProductCost>;
  getProductsUsingIngredient(ingredientId: number): Promise<number[]>;
  getProductsUsingProduct(productIngredientId: number): Promise<number[]>;

  // Data Management
  clearAllData(): Promise<void>;
  
  // System Settings
  getSettings(): Promise<any>;
  updateSettings(settings: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private ingredients: Map<number, Ingredient>;
  private products: Map<number, Product>;
  private recipes: Map<number, Recipe>;
  private priceHistory: Map<number, PriceHistory>;
  private settings: any;
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

    // Initialize settings with defaults
    this.settings = {
      defaultMarginPercentage: 60,
      priceIncreaseAlertThreshold: 20,
      highCostAlertThreshold: 50,
      enableCostAlerts: true,
      enablePriceAlerts: true,
      autoCalculateMargins: true,
      currencySymbol: "R$",
      businessName: "Minha Confeitaria"
    };

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
      { name: "Creme de Leite", category: "Laticínios", quantity: "0.2", unit: "kg", price: "3.50", brand: "Nestlé" },
      { name: "Açúcar de Confeiteiro", category: "Açúcares", quantity: "1", unit: "kg", price: "8.90", brand: "União" },
      { name: "Essência de Baunilha", category: "Essências", quantity: "0.03", unit: "kg", price: "12.00", brand: "Mix" },
      { name: "Fermento em Pó", category: "Fermentos", quantity: "0.1", unit: "kg", price: "4.20", brand: "Royal" },
      { name: "Leite Integral", category: "Laticínios", quantity: "1", unit: "litro", price: "5.50", brand: "Itambé" },
      { name: "Morango Fresco", category: "Frutas", quantity: "0.5", unit: "kg", price: "8.00", brand: "Local" },
      { name: "Chocolate Branco", category: "Chocolates", quantity: "1", unit: "kg", price: "38.00", brand: "Harald" },
      { name: "Nozes Picadas", category: "Oleaginosas", quantity: "0.2", unit: "kg", price: "25.00", brand: "Premium" },
      { name: "Açaí Polpa", category: "Frutas", quantity: "1", unit: "kg", price: "15.00", brand: "Amazônia" },
      { name: "Granola", category: "Cereais", quantity: "0.5", unit: "kg", price: "12.00", brand: "Mãe Terra" },
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
      // Alta lucratividade (>50%)
      { name: "Brigadeiro Gourmet", category: "Doces", description: "Brigadeiro cremoso de chocolate", isAlsoIngredient: true, marginPercentage: "70" },
      { name: "Cupcake de Baunilha", category: "Cupcakes", description: "Cupcake com cobertura de baunilha", isAlsoIngredient: false, marginPercentage: "60" },
      { name: "Trufa de Chocolate Branco", category: "Doces", description: "Trufa artesanal de chocolate branco", isAlsoIngredient: false, marginPercentage: "65" },
      
      // Lucratividade média (30-50%)
      { name: "Torta de Chocolate", category: "Tortas", description: "Torta de chocolate com cobertura", isAlsoIngredient: false, marginPercentage: "35" },
      { name: "Bolo de Morango", category: "Bolos", description: "Bolo com recheio de morango e chantilly", isAlsoIngredient: false, marginPercentage: "40" },
      { name: "Cheesecake de Frutas Vermelhas", category: "Tortas", description: "Cheesecake cremoso com frutas", isAlsoIngredient: false, marginPercentage: "45" },
      
      // Baixa lucratividade (<30%)
      { name: "Açaí na Tigela Premium", category: "Gelados", description: "Açaí com granola, frutas e mel", isAlsoIngredient: false, marginPercentage: "25" },
      { name: "Brownie com Nozes", category: "Doces", description: "Brownie denso com nozes caramelizadas", isAlsoIngredient: false, marginPercentage: "20" },
      { name: "Torta Holandesa", category: "Tortas", description: "Torta com creme e chocolate premium", isAlsoIngredient: false, marginPercentage: "15" },
      
      // Alta lucratividade adicional para teste
      { name: "Beijinho Gourmet", category: "Doces", description: "Beijinho artesanal com coco premium", isAlsoIngredient: false, marginPercentage: "200" },
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
      // Brigadeiro Gourmet (Product ID 1) - Alta lucratividade
      { productId: 1, ingredientId: 2, productIngredientId: null, quantity: "0.395", unit: "kg" }, // Leite Condensado
      { productId: 1, ingredientId: 3, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Chocolate
      { productId: 1, ingredientId: 5, productIngredientId: null, quantity: "0.05", unit: "kg" }, // Manteiga

      // Cupcake de Baunilha (Product ID 2) - Alta lucratividade
      { productId: 2, ingredientId: 1, productIngredientId: null, quantity: "0.15", unit: "kg" }, // Farinha
      { productId: 2, ingredientId: 4, productIngredientId: null, quantity: "0.1", unit: "kg" }, // Açúcar
      { productId: 2, ingredientId: 6, productIngredientId: null, quantity: "2", unit: "unidade" }, // Ovos
      { productId: 2, ingredientId: 9, productIngredientId: null, quantity: "0.005", unit: "kg" }, // Essência de Baunilha

      // Trufa de Chocolate Branco (Product ID 3) - Alta lucratividade
      { productId: 3, ingredientId: 13, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Chocolate Branco
      { productId: 3, ingredientId: 7, productIngredientId: null, quantity: "0.1", unit: "kg" }, // Creme de Leite
      { productId: 3, ingredientId: 5, productIngredientId: null, quantity: "0.02", unit: "kg" }, // Manteiga

      // Torta de Chocolate (Product ID 4) - Lucratividade média
      { productId: 4, ingredientId: 1, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Farinha
      { productId: 4, ingredientId: 3, productIngredientId: null, quantity: "0.25", unit: "kg" }, // Chocolate
      { productId: 4, ingredientId: 4, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Açúcar
      { productId: 4, ingredientId: 6, productIngredientId: null, quantity: "4", unit: "unidade" }, // Ovos
      { productId: 4, productIngredientId: 1, ingredientId: null, quantity: "0.2", unit: "kg" }, // Brigadeiro como ingrediente

      // Bolo de Morango (Product ID 5) - Lucratividade média
      { productId: 5, ingredientId: 1, productIngredientId: null, quantity: "0.4", unit: "kg" }, // Farinha
      { productId: 5, ingredientId: 4, productIngredientId: null, quantity: "0.25", unit: "kg" }, // Açúcar
      { productId: 5, ingredientId: 6, productIngredientId: null, quantity: "6", unit: "unidade" }, // Ovos
      { productId: 5, ingredientId: 11, productIngredientId: null, quantity: "0.3", unit: "litro" }, // Leite
      { productId: 5, ingredientId: 12, productIngredientId: null, quantity: "0.5", unit: "kg" }, // Morango

      // Cheesecake de Frutas Vermelhas (Product ID 6) - Lucratividade média
      { productId: 6, ingredientId: 7, productIngredientId: null, quantity: "0.4", unit: "kg" }, // Creme de Leite
      { productId: 6, ingredientId: 8, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Açúcar de Confeiteiro
      { productId: 6, ingredientId: 6, productIngredientId: null, quantity: "4", unit: "unidade" }, // Ovos
      { productId: 6, ingredientId: 12, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Morango

      // Açaí na Tigela Premium (Product ID 7) - Baixa lucratividade
      { productId: 7, ingredientId: 15, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Açaí Polpa
      { productId: 7, ingredientId: 16, productIngredientId: null, quantity: "0.1", unit: "kg" }, // Granola
      { productId: 7, ingredientId: 12, productIngredientId: null, quantity: "0.1", unit: "kg" }, // Morango

      // Brownie com Nozes (Product ID 8) - Baixa lucratividade
      { productId: 8, ingredientId: 3, productIngredientId: null, quantity: "0.4", unit: "kg" }, // Chocolate
      { productId: 8, ingredientId: 1, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Farinha
      { productId: 8, ingredientId: 14, productIngredientId: null, quantity: "0.15", unit: "kg" }, // Nozes
      { productId: 8, ingredientId: 5, productIngredientId: null, quantity: "0.15", unit: "kg" }, // Manteiga
      { productId: 8, ingredientId: 6, productIngredientId: null, quantity: "4", unit: "unidade" }, // Ovos

      // Torta Holandesa (Product ID 9) - Baixa lucratividade
      { productId: 9, ingredientId: 13, productIngredientId: null, quantity: "0.5", unit: "kg" }, // Chocolate Branco
      { productId: 9, ingredientId: 3, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Chocolate
      { productId: 9, ingredientId: 7, productIngredientId: null, quantity: "0.3", unit: "kg" }, // Creme de Leite
      { productId: 9, ingredientId: 14, productIngredientId: null, quantity: "0.2", unit: "kg" }, // Nozes
      { productId: 9, ingredientId: 6, productIngredientId: null, quantity: "6", unit: "unidade" }, // Ovos

      // Beijinho Gourmet (Product ID 10) - Alta lucratividade
      { productId: 10, ingredientId: 2, productIngredientId: null, quantity: "0.1", unit: "kg" }, // Leite Condensado
      { productId: 10, ingredientId: 5, productIngredientId: null, quantity: "0.02", unit: "kg" }, // Manteiga
      { productId: 10, ingredientId: 4, productIngredientId: null, quantity: "0.03", unit: "kg" }, // Açúcar (para finalizar)
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

      // Update costs for all products that use this ingredient
      const affectedProductIds = await this.getProductsUsingIngredient(id);
      for (const productId of affectedProductIds) {
        // Calculate old and new costs for the product
        const oldCost = await this.calculateProductCostAtPrice(productId, id, oldPrice);
        const newCost = await this.calculateProductCost(productId);
        
        // Record product cost history
        await this.createPriceHistory({
          ingredientId: null,
          productId: productId,
          oldPrice: oldCost.totalCost.toString(),
          newPrice: newCost.totalCost.toString(),
          changeReason: `Alteração no preço do ingrediente: ${existing.name}`,
        });
      }
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

    // Usar margem padrão das configurações se cálculo automático estiver habilitado
    let marginPercentage: number;
    if (this.settings.autoCalculateMargins && product?.marginPercentage === "60") {
      marginPercentage = this.settings.defaultMarginPercentage || 60;
    } else {
      marginPercentage = parseFloat(product?.marginPercentage || this.settings.defaultMarginPercentage?.toString() || "60");
    }
    
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

  async calculateProductCostAtPrice(productId: number, ingredientId: number, ingredientPrice: string): Promise<ProductCost> {
    const recipes = await this.getRecipesByProduct(productId);
    let totalCost = 0;

    for (const recipe of recipes) {
      if (recipe.ingredientId) {
        let ingredientPrice_: string;
        
        // Use the specific price for the changed ingredient, or current price for others
        if (recipe.ingredientId === ingredientId) {
          ingredientPrice_ = ingredientPrice;
        } else {
          const ingredient = this.ingredients.get(recipe.ingredientId);
          ingredientPrice_ = ingredient?.price || "0";
        }
        
        const ingredientCost = parseFloat(ingredientPrice_);
        const quantity = parseFloat(recipe.quantity);
        totalCost += ingredientCost * quantity;
      } else if (recipe.productIngredientId) {
        // For product ingredients, calculate their cost recursively
        const productIngredientCost = await this.calculateProductCostAtPrice(recipe.productIngredientId, ingredientId, ingredientPrice);
        const quantity = parseFloat(recipe.quantity);
        totalCost += productIngredientCost.totalCost * quantity;
      }
    }

    const product = this.products.get(productId);
    
    // Usar margem padrão das configurações se cálculo automático estiver habilitado
    let marginPercentage: number;
    if (this.settings.autoCalculateMargins && product?.marginPercentage === "60") {
      marginPercentage = this.settings.defaultMarginPercentage || 60;
    } else {
      marginPercentage = parseFloat(product?.marginPercentage || this.settings.defaultMarginPercentage?.toString() || "60");
    }
    
    const margin = marginPercentage / 100;
    const suggestedPrice = totalCost * (1 + margin);

    return {
      productId,
      totalCost,
      suggestedPrice,
      margin: marginPercentage,
    };
  }

  async clearAllData(): Promise<void> {
    this.ingredients.clear();
    this.products.clear();
    this.recipes.clear();
    this.priceHistory.clear();
    
    // Reset IDs
    this.currentIngredientId = 1;
    this.currentProductId = 1;
    this.currentRecipeId = 1;
    this.currentHistoryId = 1;
  }

  async getSettings(): Promise<any> {
    return { ...this.settings };
  }

  async updateSettings(newSettings: any): Promise<any> {
    this.settings = { ...this.settings, ...newSettings };
    return { ...this.settings };
  }
}

export const storage = new MemStorage();

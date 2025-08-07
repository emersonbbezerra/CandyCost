
import { z } from "zod";

// Ingredient schemas
export const insertIngredientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  price: z.string().min(1, "Preço é obrigatório"),
  brand: z.string().optional(),
});

// Product schemas
export const insertProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  isAlsoIngredient: z.boolean().default(false),
  marginPercentage: z.string().default("60"),
  preparationTimeMinutes: z.number().default(60),
});

// Recipe schemas
export const insertRecipeSchema = z.object({
  productId: z.number(),
  ingredientId: z.number().nullable().optional(),
  productIngredientId: z.number().nullable().optional(),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  unit: z.string().min(1, "Unidade é obrigatória"),
});

// Price History schemas
export const insertPriceHistorySchema = z.object({
  ingredientId: z.number().nullable().optional(),
  productId: z.number().nullable().optional(),
  oldPrice: z.string(),
  newPrice: z.string(),
  changeReason: z.string().optional(),
});

// Fixed Cost schemas
export const insertFixedCostSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  value: z.string().min(1, "Valor é obrigatório"),
  recurrence: z.string().min(1, "Recorrência é obrigatória"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Work Configuration schemas
export const insertWorkConfigurationSchema = z.object({
  workDaysPerWeek: z.number().default(5),
  hoursPerDay: z.string().default("8.00"),
  weeksPerMonth: z.string().default("4.0"),
});

// Type definitions based on Prisma models
export type Ingredient = {
  id: number;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  price: string;
  brand?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  isAlsoIngredient: boolean;
  marginPercentage: string;
  preparationTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Recipe = {
  id: number;
  productId: number;
  ingredientId?: number | null;
  productIngredientId?: number | null;
  quantity: string;
  unit: string;
};

export type PriceHistory = {
  id: number;
  ingredientId?: number | null;
  productId?: number | null;
  oldPrice: string;
  newPrice: string;
  changeReason?: string | null;
  createdAt: Date;
};

export type FixedCost = {
  id: number;
  name: string;
  category: string;
  value: string;
  recurrence: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkConfiguration = {
  id: number;
  workDaysPerWeek: number;
  hoursPerDay: string;
  weeksPerMonth: string;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  password: string;
  profileImageUrl?: string | null;
  role: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type UpsertUser = Omit<User, 'createdAt' | 'updatedAt'>;

// Inferred types from schemas
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type InsertFixedCost = z.infer<typeof insertFixedCostSchema>;
export type InsertWorkConfiguration = z.infer<typeof insertWorkConfigurationSchema>;

// Extended types
export type ProductWithRecipes = Product & {
  recipes: (Recipe & {
    ingredient?: Ingredient;
    productIngredient?: Product;
  })[];
};

export type ProductCost = {
  productId: number;
  totalCost: number;
  fixedCostPerUnit: number;
  suggestedPrice: number;
  margin: number;
};

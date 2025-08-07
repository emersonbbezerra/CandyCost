
import { z } from "zod";

// User schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  role: z.string().default("user"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
});

export const selectUserSchema = userSchema.omit({ password: true });

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UpsertUser = Partial<InsertUser> & { id?: string };

// Ingredient schemas
export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  price: z.number(),
  brand: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertIngredientSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  price: z.number().positive(),
  brand: z.string().optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  isAlsoIngredient: z.boolean(),
  marginPercentage: z.number(),
  preparationTimeMinutes: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  isAlsoIngredient: z.boolean().default(false),
  marginPercentage: z.number().min(0),
  preparationTimeMinutes: z.number().optional(),
});

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Recipe schemas
export const recipeSchema = z.object({
  id: z.string(),
  productId: z.string(),
  ingredientId: z.string().nullable(),
  productIngredientId: z.string().nullable(),
  quantity: z.number(),
  unit: z.string(),
});

export const insertRecipeSchema = z.object({
  productId: z.string(),
  ingredientId: z.string().optional(),
  productIngredientId: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

// Fixed Cost schemas
export const fixedCostSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  value: z.number(),
  recurrence: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertFixedCostSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  value: z.number().positive(),
  recurrence: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type FixedCost = z.infer<typeof fixedCostSchema>;
export type InsertFixedCost = z.infer<typeof insertFixedCostSchema>;

// Price History schemas
export const priceHistorySchema = z.object({
  id: z.string(),
  itemType: z.string(),
  itemName: z.string(),
  oldPrice: z.number(),
  newPrice: z.number(),
  changeType: z.string(),
  description: z.string().nullable(),
  ingredientId: z.string().nullable(),
  productId: z.string().nullable(),
  createdAt: z.date(),
});

export const insertPriceHistorySchema = z.object({
  itemType: z.string(),
  itemName: z.string(),
  oldPrice: z.number(),
  newPrice: z.number(),
  changeType: z.string(),
  description: z.string().optional(),
  ingredientId: z.string().optional(),
  productId: z.string().optional(),
});

export type PriceHistory = z.infer<typeof priceHistorySchema>;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;

// Work Configuration schemas
export const workConfigurationSchema = z.object({
  id: z.string(),
  hoursPerDay: z.number(),
  daysPerMonth: z.number(),
  hourlyRate: z.number(),
  highCostAlertThreshold: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertWorkConfigurationSchema = z.object({
  hoursPerDay: z.number().positive().default(8.0),
  daysPerMonth: z.number().positive().default(22.0),
  hourlyRate: z.number().positive().default(25.0),
  highCostAlertThreshold: z.number().positive().default(50.0),
});

export type WorkConfiguration = z.infer<typeof workConfigurationSchema>;
export type InsertWorkConfiguration = z.infer<typeof insertWorkConfigurationSchema>;

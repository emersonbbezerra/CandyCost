import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  brand: text("brand"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isAlsoIngredient: boolean("is_also_ingredient").notNull().default(false),
  marginPercentage: decimal("margin_percentage", { precision: 5, scale: 2 }).notNull().default("60"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  productIngredientId: integer("product_ingredient_id").references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  productId: integer("product_id").references(() => products.id),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
}).extend({
  ingredientId: z.number().nullable(),
  productIngredientId: z.number().nullable(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  createdAt: true,
});

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;

export type ProductWithRecipes = Product & {
  recipes: (Recipe & {
    ingredient?: Ingredient;
    productIngredient?: Product;
  })[];
};

export type ProductCost = {
  productId: number;
  totalCost: number;
  suggestedPrice: number;
  margin: number;
};

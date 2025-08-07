
import { prisma } from "../db";
import type { Product, InsertProduct } from "@shared/schema";

export const productRepository = {
  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
    
    return products.map(product => ({
      ...product,
      marginPercentage: product.marginPercentage.toString(),
    }));
  },

  async findById(id: number): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) return null;
    
    return {
      ...product,
      marginPercentage: product.marginPercentage.toString(),
    };
  },

  async findWithRecipes(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            ingredient: true,
            productIngredient: true
          }
        }
      }
    });
    
    if (!product) return null;
    
    return {
      ...product,
      marginPercentage: product.marginPercentage.toString(),
      recipes: product.recipes.map(recipe => ({
        ...recipe,
        quantity: recipe.quantity.toString(),
        ingredient: recipe.ingredient ? {
          ...recipe.ingredient,
          quantity: recipe.ingredient.quantity.toString(),
          price: recipe.ingredient.price.toString(),
        } : undefined,
        productIngredient: recipe.productIngredient ? {
          ...recipe.productIngredient,
          marginPercentage: recipe.productIngredient.marginPercentage.toString(),
        } : undefined,
      }))
    };
  },

  async create(data: InsertProduct): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        ...data,
        marginPercentage: parseFloat(data.marginPercentage),
      }
    });
    
    return {
      ...product,
      marginPercentage: product.marginPercentage.toString(),
    };
  },

  async update(id: number, data: Partial<InsertProduct>): Promise<Product> {
    const updateData: any = { ...data };
    
    if (data.marginPercentage) {
      updateData.marginPercentage = parseFloat(data.marginPercentage);
    }
    
    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });
    
    return {
      ...product,
      marginPercentage: product.marginPercentage.toString(),
    };
  },

  async delete(id: number): Promise<void> {
    await prisma.product.delete({
      where: { id }
    });
  }
};

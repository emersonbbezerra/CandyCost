import { Request, Response } from "express";
import { z } from "zod";
import { productService } from "../services/productService";

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await productService.getProducts();
    const productsWithCosts = await Promise.all(
      products.map(async (product) => {
        try {
          const cost = await productService.calculateProductCost(product.id);
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
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID do produto inválido" });
    }
    
    const product = await productService.getProductWithRecipes(id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }
    
    // Ensure required fields are present
    const sanitizedProduct = {
      ...product,
      marginPercentage: product.marginPercentage || "60",
      preparationTimeMinutes: product.preparationTimeMinutes || 60,
      recipes: product.recipes || []
    };
    
    try {
      const cost = await productService.calculateProductCost(id);
      res.json({ ...sanitizedProduct, cost });
    } catch (costError) {
      console.error("Erro ao calcular custo do produto:", costError);
      res.json({ ...sanitizedProduct, cost: null });
    }
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ message: "Erro ao buscar produto" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = z.object({
      name: z.string(),
      category: z.string(),
      description: z.string().optional(),
      isAlsoIngredient: z.boolean().optional(),
      marginPercentage: z.string().optional(),
      preparationTimeMinutes: z.number().optional(),
    }).parse(req.body);

    const product = await productService.createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar produto" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      isAlsoIngredient: z.boolean().optional(),
      marginPercentage: z.string().optional(),
      preparationTimeMinutes: z.number().optional(),
    }).partial().parse(req.body);

    const product = await productService.updateProduct(id, data);
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao atualizar produto" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar produto" });
  }
};

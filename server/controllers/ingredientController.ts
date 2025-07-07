import { Request, Response } from "express";
import { z } from "zod";
import { productService } from "../services/productService";

export const getIngredients = async (_req: Request, res: Response) => {
  try {
    const ingredients = await productService.getIngredients();
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar ingredientes" });
  }
};

export const getIngredientById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ingredient = await productService.getIngredient(id);
    if (!ingredient) {
      return res.status(404).json({ message: "Ingrediente não encontrado" });
    }
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar ingrediente" });
  }
};

export const createIngredient = async (req: Request, res: Response) => {
  try {
    const data = z.object({
      name: z.string(),
      category: z.string(),
      quantity: z.string(),
      unit: z.string(),
      price: z.string(),
      brand: z.string().optional(),
    }).parse(req.body);

    const ingredient = await productService.createIngredient(data);
    res.status(201).json(ingredient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar ingrediente" });
  }
};

export const updateIngredient = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      price: z.string().optional(),
      brand: z.string().optional(),
    }).partial().parse(req.body);

    const ingredient = await productService.updateIngredient(id, data);
    
    // Get products affected by this ingredient change
    const affectedProducts = await productService.getProductsUsingIngredient(id);
    
    res.json({ ingredient, affectedProducts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao atualizar ingrediente" });
  }
};

export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await productService.deleteIngredient(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar ingrediente" });
  }
};

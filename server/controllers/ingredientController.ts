import { Request, Response } from "express";
import { z } from "zod";
import { productService } from "../services/productService";

export const getIngredients = async (_req: Request, res: Response) => {
  try {
    const ingredients = await productService.getIngredients();
    res.json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ message: "Erro ao buscar ingredientes" });
  }
};

export const getIngredientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ingredient = await productService.getIngredient(id);
    if (!ingredient) {
      return res.status(404).json({ message: "Ingrediente não encontrado" });
    }
    res.json(ingredient);
  } catch (error) {
    console.error("Error fetching ingredient by ID:", error);
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
    const { id } = req.params;
    const ingredientData = req.body;

    console.log("Updating ingredient:", id, ingredientData);

    // Buscar ingrediente anterior para comparar preços
    const oldIngredient = await productService.getIngredient(id);

    const result = await productService.updateIngredient(id, ingredientData);

    // Se o preço mudou, rastrear mudanças nos produtos afetados
    if (oldIngredient && ingredientData.price && oldIngredient.price !== ingredientData.price) {
      console.log("Price changed, tracking affected products...");
      await productService.trackCostChangesForAffectedProducts(
        id,
        oldIngredient.price,
        ingredientData.price
      );
    }

    res.json(result);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(500).json({ message: "Erro ao atualizar ingrediente" });
  }
};

export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar se o ingrediente existe
    const existingIngredient = await productService.getIngredient(id);
    if (!existingIngredient) {
      return res.status(404).json({ message: "Ingrediente não encontrado" });
    }
    
    await productService.deleteIngredient(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ message: "Erro ao deletar ingrediente" });
  }
};
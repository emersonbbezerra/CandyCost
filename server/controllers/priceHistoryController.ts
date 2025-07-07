import { Request, Response } from "express";
import { priceHistoryService } from "../services/priceHistoryService";

export const getPriceHistory = async (req: Request, res: Response) => {
  try {
    const ingredientId = req.query.ingredientId ? parseInt(req.query.ingredientId as string) : undefined;
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    
    const history = await priceHistoryService.getPriceHistory(ingredientId, productId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar histórico de preços" });
  }
};

import { Request, Response } from 'express';
import { priceHistoryService } from '../services/priceHistoryService';

export const getPriceHistory = async (req: Request, res: Response) => {
  try {
    const ingredientId = req.query.ingredientId
      ? String(req.query.ingredientId)
      : undefined;
    const productId = req.query.productId
      ? String(req.query.productId)
      : undefined;

    const history = await priceHistoryService.getPriceHistory(
      ingredientId,
      productId
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar histórico de preços' });
  }
};

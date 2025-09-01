import { Request, Response } from 'express';
import { z } from 'zod';
import { priceHistoryService } from '../services/priceHistoryService';
import { productService } from '../services/productService';

export const getIngredients = async (_req: Request, res: Response) => {
  try {
    const ingredients = await productService.getIngredients();
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ message: 'Erro ao buscar ingredientes' });
  }
};

export const getIngredientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ingredient = await productService.getIngredient(id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado' });
    }
    res.json(ingredient);
  } catch (error) {
    console.error('Error fetching ingredient by ID:', error);
    res.status(500).json({ message: 'Erro ao buscar ingrediente' });
  }
};

export const createIngredient = async (req: Request, res: Response) => {
  try {
    const data = z
      .object({
        name: z.string(),
        category: z.string(),
        quantity: z.string(),
        unit: z.string(),
        price: z.string(),
        brand: z.string().optional(),
      })
      .parse(req.body);

    const ingredient = await productService.createIngredient(data);
    res.status(201).json(ingredient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Dados inválidos', errors: error.issues });
    }
    res.status(500).json({ message: 'Erro ao criar ingrediente' });
  }
};

export const updateIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ingredientData = req.body;

    console.log('Updating ingredient:', id, ingredientData);

    // Buscar ingrediente anterior para comparar preços
    const oldIngredient = await productService.getIngredient(id);

    const result = await productService.updateIngredient(id, ingredientData);

    // Se o preço OU a quantidade mudaram (afetando o preço por unidade), registrar histórico e rastrear produtos afetados
    if (
      oldIngredient &&
      ingredientData.price !== undefined &&
      ingredientData.quantity !== undefined
    ) {
      const oldTotalPrice = parseFloat(String(oldIngredient.price));
      const oldQuantity = parseFloat(String(oldIngredient.quantity));
      const newTotalPrice = parseFloat(String(ingredientData.price));
      const newQuantity = parseFloat(String(ingredientData.quantity));

      // Normalizar ambos os preços para uma unidade padrão para comparação justa
      const oldUnit = oldIngredient.unit;
      const newUnit = ingredientData.unit || oldIngredient.unit;

      let oldNormalizedUnitPrice = oldTotalPrice / oldQuantity;
      let newNormalizedUnitPrice = newTotalPrice / newQuantity;

      // Converter para unidades base para comparação:
      // - Peso: converter para gramas (g)
      // - Volume: converter para mililitros (ml)
      // - Quantidade: converter para unidades individuais (un)

      // Normalizar preço antigo
      if (oldUnit === 'kg') {
        oldNormalizedUnitPrice = oldNormalizedUnitPrice / 1000; // preço por g
      } else if (oldUnit === 'l') {
        oldNormalizedUnitPrice = oldNormalizedUnitPrice / 1000; // preço por ml
      } else if (
        oldUnit === 'dúzia' ||
        oldUnit === 'duzia' ||
        oldUnit === 'dz'
      ) {
        oldNormalizedUnitPrice = oldNormalizedUnitPrice / 12; // preço por unidade
      }

      // Normalizar preço novo
      if (newUnit === 'kg') {
        newNormalizedUnitPrice = newNormalizedUnitPrice / 1000; // preço por g
      } else if (newUnit === 'l') {
        newNormalizedUnitPrice = newNormalizedUnitPrice / 1000; // preço por ml
      } else if (
        newUnit === 'dúzia' ||
        newUnit === 'duzia' ||
        newUnit === 'dz'
      ) {
        newNormalizedUnitPrice = newNormalizedUnitPrice / 12; // preço por unidade
      }

      // Verificar se o preço por unidade normalizado realmente mudou
      const unitPriceChanged =
        Math.abs(oldNormalizedUnitPrice - newNormalizedUnitPrice) > 0.0001;

      console.log('🔍 Price comparison:', {
        oldTotal: oldTotalPrice,
        oldQuantity,
        oldUnit,
        newTotal: newTotalPrice,
        newQuantity,
        newUnit,
        oldNormalizedUnitPrice: oldNormalizedUnitPrice.toFixed(6),
        newNormalizedUnitPrice: newNormalizedUnitPrice.toFixed(6),
        difference: Math.abs(
          oldNormalizedUnitPrice - newNormalizedUnitPrice
        ).toFixed(6),
        changed: unitPriceChanged,
      });

      if (unitPriceChanged) {
        console.log(
          '🔄 [updateIngredient] Unit price changed, tracking affected products...'
        );

        // Registrar histórico do próprio ingrediente usando preço por unidade normalizado
        await priceHistoryService.createPriceHistory({
          itemType: 'ingredient',
          itemName: oldIngredient.name,
          oldPrice: oldNormalizedUnitPrice,
          newPrice: newNormalizedUnitPrice,
          changeType: 'manual',
          changeReason: `Alteração manual: ${oldTotalPrice.toFixed(
            2
          )}/${oldQuantity}${oldUnit} → ${newTotalPrice.toFixed(
            2
          )}/${newQuantity}${newUnit}`,
          ingredientId: id,
        });

        // Rastrear produtos afetados (passando preços por unidade normalizados)
        await productService.trackCostChangesForAffectedProducts(
          id,
          oldNormalizedUnitPrice,
          newNormalizedUnitPrice
        );
      } else {
        console.log('Unit price unchanged, no tracking needed');
      }
    } else {
      console.log('Missing data for unit price comparison:', {
        hasOldIngredient: !!oldIngredient,
        hasPrice: ingredientData.price !== undefined,
        hasQuantity: ingredientData.quantity !== undefined,
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ message: 'Erro ao atualizar ingrediente' });
  }
};

export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o ingrediente existe
    const existingIngredient = await productService.getIngredient(id);
    if (!existingIngredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado' });
    }

    await productService.deleteIngredient(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ message: 'Erro ao deletar ingrediente' });
  }
};

import { Request, Response } from 'express';
import { z } from 'zod';
import { priceHistoryService } from '../services/priceHistoryService';
import { productService } from '../services/productService';
import { getUnitLabel } from '../utils/unitLabels.js';

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

    // Buscar ingrediente anterior para comparar preços E unidades
    const oldIngredient = await productService.getIngredient(id);

    // Verificar se houve mudança de unidade
    let unitChanged = false;
    let conversionResults = null;

    if (
      oldIngredient &&
      ingredientData.unit &&
      oldIngredient.unit !== ingredientData.unit
    ) {
      unitChanged = true;
      console.log(
        `🔄 [updateIngredient] Unit change detected: ${oldIngredient.unit} → ${ingredientData.unit}`
      );

      // Executar conversão automática das receitas
      try {
        conversionResults =
          await productService.convertRecipeQuantitiesOnUnitChange(
            id,
            oldIngredient.unit,
            ingredientData.unit
          );

        console.log(
          `📊 [updateIngredient] Recipe conversion results:`,
          conversionResults
        );

        // Verificar se houve erro de incompatibilidade de unidades
        const hasIncompatibilityError = conversionResults.errors.some(
          (error) =>
            error.includes('incompatíveis') || error.includes('incompatible')
        );

        if (hasIncompatibilityError) {
          console.error(
            '❌ [updateIngredient] Unit conversion failed due to incompatibility'
          );

          // Extrair a mensagem específica de incompatibilidade e substituir por nomes amigáveis
          let incompatibilityMessage =
            conversionResults.errors.find(
              (error) =>
                error.includes('incompatíveis') ||
                error.includes('incompatible')
            ) || 'Unidades incompatíveis para conversão';

          // Substituir nomes internos de unidades por nomes amigáveis na mensagem
          const oldUnitLabel = getUnitLabel(oldIngredient.unit);
          const newUnitLabel = getUnitLabel(ingredientData.unit);

          // Criar mensagem personalizada com nomes amigáveis
          const friendlyMessage = `Unidades incompatíveis: não é possível converter de ${oldUnitLabel} para ${newUnitLabel}`;

          return res.status(400).json({
            error: friendlyMessage,
            details: `Não é possível converter automaticamente de ${oldUnitLabel} para ${newUnitLabel}. As receitas que usam este ingrediente não podem ser atualizadas automaticamente.`,
            suggestion:
              'Considere manter a unidade atual ou converter as receitas manualmente.',
            originalUnit: oldUnitLabel,
            targetUnit: newUnitLabel,
          });
        }

        if (conversionResults.errors.length > 0) {
          console.warn(
            '⚠️ [updateIngredient] Some recipe conversions had errors:',
            conversionResults.errors
          );
        }
      } catch (conversionError) {
        console.error(
          '❌ [updateIngredient] Error during recipe conversion:',
          conversionError
        );
        return res.status(500).json({
          error: 'Erro interno durante conversão de receitas',
          details:
            conversionError instanceof Error
              ? conversionError.message
              : String(conversionError),
        });
      }
    }

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
        unitChanged,
      });

      if (unitPriceChanged) {
        console.log(
          '🔄 [updateIngredient] Unit price changed, tracking affected products...'
        );

        // Preparar changeReason com informações sobre conversão de receitas
        let changeReason = `Alteração manual: ${oldTotalPrice.toFixed(
          2
        )}/${oldQuantity}${oldUnit} → ${newTotalPrice.toFixed(
          2
        )}/${newQuantity}${newUnit}`;

        if (unitChanged && conversionResults) {
          changeReason += ` | ${conversionResults.convertedRecipes} receitas convertidas automaticamente`;
          if (conversionResults.errors.length > 0) {
            changeReason += ` (${conversionResults.errors.length} erros)`;
          }
        }

        // Registrar histórico do próprio ingrediente usando preço por unidade normalizado
        await priceHistoryService.createPriceHistory({
          itemType: 'ingredient',
          itemName: oldIngredient.name,
          oldPrice: oldNormalizedUnitPrice,
          newPrice: newNormalizedUnitPrice,
          changeType: unitChanged ? 'unit_conversion' : 'manual',
          changeReason,
          ingredientId: id,
          // Adicionar dados contextuais para melhor apresentação no frontend
          contextData: {
            originalOldPrice: oldTotalPrice,
            originalOldQuantity: oldQuantity,
            originalOldUnit: oldUnit,
            originalNewPrice: newTotalPrice,
            originalNewQuantity: newQuantity,
            originalNewUnit: newUnit,
          },
        });

        // Rastrear produtos afetados (passando preços por unidade normalizados)
        await productService.trackCostChangesForAffectedProducts(
          id,
          oldNormalizedUnitPrice,
          newNormalizedUnitPrice
        );
      } else if (unitChanged && conversionResults) {
        // Se apenas a unidade mudou mas não o preço, registrar histórico de conversão
        console.log(
          '🔄 [updateIngredient] Only unit changed, registering conversion history...'
        );

        await priceHistoryService.createPriceHistory({
          itemType: 'ingredient',
          itemName: oldIngredient.name,
          oldPrice: oldNormalizedUnitPrice,
          newPrice: newNormalizedUnitPrice,
          changeType: 'unit_conversion',
          changeReason: `Conversão de unidade: ${oldUnit} → ${newUnit} | ${conversionResults.convertedRecipes} receitas convertidas automaticamente`,
          ingredientId: id,
          contextData: {
            originalOldPrice: oldTotalPrice,
            originalOldQuantity: oldQuantity,
            originalOldUnit: oldUnit,
            originalNewPrice: newTotalPrice,
            originalNewQuantity: newQuantity,
            originalNewUnit: newUnit,
          },
        });
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

    // Preparar resposta com informações sobre conversões realizadas
    const response = {
      ...result,
      conversionInfo: conversionResults
        ? {
            convertedRecipes: conversionResults.convertedRecipes,
            conversionErrors: conversionResults.errors,
          }
        : null,
    };

    res.json(response);
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

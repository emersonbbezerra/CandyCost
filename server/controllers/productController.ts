import { Request, Response } from 'express';
import { z } from 'zod';
import { priceHistoryService } from '../services/priceHistoryService';
import { productService } from '../services/productService';

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
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID do produto inválido' });
    }

    const product = await productService.getProductWithRecipes(id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Ensure required fields are present
    const sanitizedProduct = {
      ...product,
      marginPercentage: product.marginPercentage || '60',
      preparationTimeMinutes: product.preparationTimeMinutes || 60,
      recipes: product.recipes || [],
    };

    try {
      const cost = await productService.calculateProductCost(id);
      res.json({ ...sanitizedProduct, cost });
    } catch (costError) {
      console.error('Erro ao calcular custo do produto:', costError);
      res.json({ ...sanitizedProduct, cost: null });
    }
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = z
      .object({
        name: z.string(),
        category: z.string(),
        description: z.string().optional(),
        isAlsoIngredient: z.boolean().optional(),
        marginPercentage: z.union([z.string(), z.number()]).optional(),
        preparationTimeMinutes: z.number().optional(),
        salePrice: z.number(),
        yield: z.number(),
        yieldUnit: z.string(),
      })
      .parse(req.body);

    // Ajustar tipos para compatibilidade com InsertProduct
    const productData = {
      name: data.name,
      category: data.category,
      description: data.description,
      isAlsoIngredient: data.isAlsoIngredient ?? false,
      marginPercentage:
        data.marginPercentage !== undefined
          ? typeof data.marginPercentage === 'string'
            ? parseFloat(data.marginPercentage)
            : data.marginPercentage
          : 0,
      preparationTimeMinutes: data.preparationTimeMinutes,
      salePrice: data.salePrice,
      yield: data.yield,
      yieldUnit: data.yieldUnit,
    };
    const product = await productService.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Dados inválidos', errors: error.issues });
    }
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = z
      .object({
        name: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        isAlsoIngredient: z.boolean().optional(),
        marginPercentage: z.union([z.string(), z.number()]).optional(),
        preparationTimeMinutes: z.number().optional(),
        salePrice: z.union([z.string(), z.number()]).optional(),
        yield: z.union([z.string(), z.number()]).optional(),
        yieldUnit: z.string().min(1).optional(),
      })
      .partial()
      .parse(req.body);

    // Capturar custo atual ANTES da atualização
    const oldCost = await productService.calculateProductCost(id);
    console.log(
      '[ProductController] Old cost before update:',
      oldCost.costPerYieldUnit
    );

    // Ajustar tipos para compatibilidade com Partial<InsertProduct>
    const parsedSalePrice =
      typeof data.salePrice === 'string'
        ? parseFloat(data.salePrice)
        : data.salePrice;
    const parsedYield =
      typeof data.yield === 'string' ? parseFloat(data.yield) : data.yield;

    const updateData: Partial<import('@shared/schema').InsertProduct> = {
      name: data.name,
      category: data.category,
      description: data.description,
      isAlsoIngredient:
        typeof data.isAlsoIngredient === 'boolean'
          ? data.isAlsoIngredient
          : undefined,
      marginPercentage:
        data.marginPercentage !== undefined
          ? typeof data.marginPercentage === 'string'
            ? parseFloat(data.marginPercentage)
            : data.marginPercentage
          : undefined,
      preparationTimeMinutes: data.preparationTimeMinutes,
      salePrice:
        typeof parsedSalePrice === 'number' && !isNaN(parsedSalePrice)
          ? parsedSalePrice
          : undefined,
      yield:
        typeof parsedYield === 'number' && !isNaN(parsedYield)
          ? parsedYield
          : undefined,
      yieldUnit:
        typeof data.yieldUnit === 'string' ? data.yieldUnit : undefined,
    };
    // Log simples para depuração (pode ser removido depois)
    console.log(
      '[updateProduct] id:',
      id,
      'raw body:',
      req.body,
      'parsed:',
      updateData
    );
    // Remover campos undefined para evitar erro do Prisma
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const product = await productService.updateProduct(id, updateData);

    // Recalcular custo APÓS a atualização
    const newCost = await productService.calculateProductCost(id);
    console.log(
      '[ProductController] New cost after update:',
      newCost.costPerYieldUnit
    );

    // Registrar no histórico se campos que afetam custo foram alterados
    const costAffectingFields = [
      'yield',
      'salePrice',
      'marginPercentage',
      'preparationTimeMinutes',
    ];
    const changedFields = costAffectingFields.filter(
      (field) => data[field as keyof typeof data] !== undefined
    );

    if (changedFields.length > 0) {
      console.log(
        '[ProductController] Cost-affecting fields changed:',
        changedFields
      );

      const oldCostPerUnit = oldCost.costPerYieldUnit ?? 0;
      const newCostPerUnit = newCost.costPerYieldUnit ?? 0;
      const threshold = 0.0001;

      console.log(
        `[ProductController] Cost comparison: ${oldCostPerUnit.toFixed(
          6
        )} -> ${newCostPerUnit.toFixed(6)}, diff: ${Math.abs(
          newCostPerUnit - oldCostPerUnit
        ).toFixed(6)}`
      );

      if (Math.abs(newCostPerUnit - oldCostPerUnit) > threshold) {
        console.log(
          '[ProductController] Registering cost change in price history...'
        );

        const changeReason = `Atualização de ${changedFields.join(', ')}`;

        await priceHistoryService.createPriceHistory({
          productId: id,
          itemType: 'product',
          oldPrice: oldCostPerUnit,
          newPrice: newCostPerUnit,
          changeReason,
          changeType: 'product_update',
        });

        console.log('[ProductController] Price history recorded successfully');
      } else {
        console.log(
          '[ProductController] Cost change too small, not recording in history'
        );
      }
    }

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Dados inválidos', errors: error.issues });
    }
    console.error('[ProductController] Error updating product:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID do produto inválido' });
    }
    await productService.deleteProduct(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[deleteProduct] Erro ao deletar produto:', error);
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.status(500).json({ message: 'Erro ao deletar produto' });
  }
};

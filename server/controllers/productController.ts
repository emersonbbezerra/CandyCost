import { Request, Response } from 'express';
import { z } from 'zod';
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
        marginPercentage: z.string().optional(),
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
      marginPercentage: data.marginPercentage
        ? parseFloat(data.marginPercentage)
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
        marginPercentage: z.string().optional(),
        preparationTimeMinutes: z.number().optional(),
        salePrice: z.number().min(0).optional(),
        yield: z.number().min(1).optional(),
        yieldUnit: z.string().min(1).optional(),
      })
      .partial()
      .parse(req.body);

    // Ajustar tipos para compatibilidade com Partial<InsertProduct>
    const updateData: Partial<import('@shared/schema').InsertProduct> = {
      name: data.name,
      category: data.category,
      description: data.description,
      isAlsoIngredient:
        typeof data.isAlsoIngredient === 'boolean'
          ? data.isAlsoIngredient
          : undefined,
      marginPercentage: data.marginPercentage
        ? parseFloat(data.marginPercentage)
        : undefined,
      preparationTimeMinutes: data.preparationTimeMinutes,
      salePrice:
        typeof data.salePrice === 'number' ? data.salePrice : undefined,
      yield: typeof data.yield === 'number' ? data.yield : undefined,
      yieldUnit:
        typeof data.yieldUnit === 'string' ? data.yieldUnit : undefined,
    };
    // Remover campos undefined para evitar erro do Prisma
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    const product = await productService.updateProduct(id, updateData);
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Dados inválidos', errors: error.issues });
    }
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar produto' });
  }
};

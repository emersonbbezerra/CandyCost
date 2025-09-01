// Utilitário para conversão de unidades de medida

interface UnitConversion {
  [key: string]: {
    [key: string]: number; // fator de conversão
  };
}

// Fatores de conversão entre unidades
const UNIT_CONVERSIONS: UnitConversion = {
  // Conversões de peso
  kg: {
    g: 1000,
    kg: 1,
  },
  g: {
    kg: 0.001,
    g: 1,
  },

  // Conversões de volume
  l: {
    ml: 1000,
    l: 1,
  },
  ml: {
    l: 0.001,
    ml: 1,
  },

  // Unidades genéricas e conversões
  un: {
    un: 1,
    unidade: 1,
    peça: 1,
    dúzia: 1 / 12, // 1 unidade = 1/12 dúzia
    duzia: 1 / 12, // variação sem acento
    dz: 1 / 12, // abreviação
  },
  unidade: {
    un: 1,
    unidade: 1,
    peça: 1,
    dúzia: 1 / 12,
    duzia: 1 / 12,
    dz: 1 / 12,
  },
  peça: {
    un: 1,
    unidade: 1,
    peça: 1,
    dúzia: 1 / 12,
    duzia: 1 / 12,
    dz: 1 / 12,
  },
  dúzia: {
    un: 12, // 1 dúzia = 12 unidades
    unidade: 12,
    peça: 12,
    dúzia: 1,
    duzia: 1,
    dz: 1,
  },
  duzia: {
    // variação sem acento
    un: 12,
    unidade: 12,
    peça: 12,
    dúzia: 1,
    duzia: 1,
    dz: 1,
  },
  dz: {
    // abreviação
    un: 12,
    unidade: 12,
    peça: 12,
    dúzia: 1,
    duzia: 1,
    dz: 1,
  },
};

/**
 * Converte uma quantidade de uma unidade para outra
 * @param quantity Quantidade a ser convertida
 * @param fromUnit Unidade de origem
 * @param toUnit Unidade de destino
 * @returns Quantidade convertida ou null se a conversão não for possível
 */
export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  // Normalizar unidades (minúsculas, sem espaços)
  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();

  // Se as unidades são iguais, não há conversão necessária
  if (normalizedFromUnit === normalizedToUnit) {
    return quantity;
  }

  // Verificar se existe conversão disponível
  const fromUnitConversions = UNIT_CONVERSIONS[normalizedFromUnit];
  if (!fromUnitConversions) {
    console.warn(`Unidade de origem não suportada para conversão: ${fromUnit}`);
    return null;
  }

  const conversionFactor = fromUnitConversions[normalizedToUnit];
  if (conversionFactor === undefined) {
    console.warn(`Conversão não disponível de ${fromUnit} para ${toUnit}`);
    return null;
  }

  return quantity * conversionFactor;
}

/**
 * Verifica se duas unidades são compatíveis para conversão
 * @param unit1 Primeira unidade
 * @param unit2 Segunda unidade
 * @returns true se as unidades são compatíveis
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const normalizedUnit1 = unit1.toLowerCase().trim();
  const normalizedUnit2 = unit2.toLowerCase().trim();

  if (normalizedUnit1 === normalizedUnit2) {
    return true;
  }

  const unit1Conversions = UNIT_CONVERSIONS[normalizedUnit1];
  if (!unit1Conversions) {
    return false;
  }

  return unit1Conversions[normalizedUnit2] !== undefined;
}

/**
 * Calcula o custo por unidade considerando conversões quando necessário
 * @param ingredientPrice Preço total do ingrediente
 * @param ingredientQuantity Quantidade do ingrediente
 * @param ingredientUnit Unidade do ingrediente
 * @param recipeQuantity Quantidade na receita
 * @param recipeUnit Unidade na receita
 * @returns Custo calculado ou null se não for possível calcular
 */
export function calculateIngredientCost(
  ingredientPrice: number,
  ingredientQuantity: number,
  ingredientUnit: string,
  recipeQuantity: number,
  recipeUnit: string
): number | null {
  // Calcular preço por unidade do ingrediente
  const pricePerUnit = ingredientPrice / ingredientQuantity;

  // Se as unidades são iguais, cálculo direto
  if (ingredientUnit.toLowerCase().trim() === recipeUnit.toLowerCase().trim()) {
    return pricePerUnit * recipeQuantity;
  }

  // Tentar converter a quantidade da receita para a unidade do ingrediente
  const convertedRecipeQuantity = convertUnits(
    recipeQuantity,
    recipeUnit,
    ingredientUnit
  );

  if (convertedRecipeQuantity === null) {
    console.error(
      `Não foi possível converter ${recipeQuantity} ${recipeUnit} para ${ingredientUnit}`
    );
    return null;
  }

  return pricePerUnit * convertedRecipeQuantity;
}

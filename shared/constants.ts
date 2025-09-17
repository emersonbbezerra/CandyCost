// Categorias de ingredientes
export const INGREDIENT_CATEGORIES = [
  { value: 'Açúcares', label: 'Açúcares' },
  { value: 'Chocolates', label: 'Chocolates' },
  { value: 'Embalagens', label: 'Embalagens' },
  { value: 'Especiarias', label: 'Especiarias' },
  { value: 'Farinhas', label: 'Farinhas' },
  { value: 'Frutas', label: 'Frutas' },
  { value: 'Laticínios', label: 'Laticínios' },
  { value: 'Oleaginosas', label: 'Oleaginosas' },
  { value: 'Perecíveis', label: 'Perecíveis' },
  { value: 'Outros', label: 'Outros' },
];

// Categorias de produtos
export const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Bolos',
  'Caldas',
  'Caseirinhos',
  'Coberturas',
  'Doces',
  'Fatias',
  'Páscoa',
  'Recheios',
  'Salgados',
  'Sobremesas',
  'Tortas Especiais',
  'Tortas Tradicionais',
  'Outros',
] as const;

export const FIXED_COST_CATEGORIES = [
  'Aluguel',
  'Despesas Administrativas',
  'Energia Elétrica',
  'Funcionários',
  'Gás, Água',
  'Impostos e Taxas',
  'Internet',
  'Manutenção e Limpeza',
  'Marketing',
  'Outros',
] as const;

export const RECURRENCE_TYPES = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
] as const;

// Unidades de medida
export const UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'L' },
  { value: 'ml', label: 'mL' },
  { value: 'un', label: 'Unidade' },
  { value: 'dúzia', label: 'Dúzia' },
  { value: 'xícara', label: 'Xícara' },
  { value: 'colher_sopa', label: 'Colher de Sopa' },
  { value: 'colher_cha', label: 'Colher de Chá' },
  { value: 'pitada', label: 'Pitada' },
];

// Categorias de ingredientes
export const INGREDIENT_CATEGORIES = [
  { value: 'Laticínios', label: 'Laticínios' },
  { value: 'Farinhas', label: 'Farinhas' },
  { value: 'Açúcares', label: 'Açúcares' },
  { value: 'Chocolates', label: 'Chocolates' },
  { value: 'Frutas', label: 'Frutas' },
  { value: 'Especiarias', label: 'Especiarias' },
  { value: 'Oleaginosas', label: 'Oleaginosas' },
  { value: 'Ovos', label: 'Ovos' },
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
  'Energia elétrica',
  'Internet',
  'Funcionários',
  'Gás, água',
  'Embalagens gerais',
  'Despesas administrativas',
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
  { value: 'unidade', label: 'Unidade' },
  { value: 'dúzia', label: 'Dúzia' },
  { value: 'xícara', label: 'Xícara' },
  { value: 'colher_sopa', label: 'Colher de Sopa' },
  { value: 'colher_cha', label: 'Colher de Chá' },
  { value: 'pitada', label: 'Pitada' },
];

/**
 * Mapeamento de unidades internas para nomes amigáveis ao usuário
 * Baseado nas opções disponíveis no select da interface:
 * Kg, g, L, mL, Unidade, Dúzia, Xícara, Colher de Sopa, Colher de Chá, Pitada
 */
export const UNIT_LABELS: Record<string, string> = {
  // Peso
  kg: 'Kg',
  g: 'g',

  // Volume
  l: 'L',
  ml: 'mL',

  // Quantidade
  un: 'Unidade',
  unidade: 'Unidade',
  dúzia: 'Dúzia',
  duzia: 'Dúzia', // variação sem acento

  // Volume culinário
  colher_sopa: 'Colher de Sopa',
  colher_cha: 'Colher de Chá',
  xicara: 'Xícara',
  pitada: 'Pitada',
};

/**
 * Converte uma unidade interna para seu nome amigável
 * @param unit Unidade interna (ex: 'colher_sopa')
 * @returns Nome amigável (ex: 'Colher de Sopa')
 */
export function getUnitLabel(unit: string): string {
  return UNIT_LABELS[unit] || unit;
}

/**
 * Lista de todas as unidades disponíveis no sistema
 */
export const AVAILABLE_UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'un',
  'dúzia',
  'colher_sopa',
  'colher_cha',
  'xicara',
  'pitada',
] as const;

/**
 * Verifica se uma unidade é válida no sistema
 */
export function isValidUnit(unit: string): boolean {
  return unit in UNIT_LABELS;
}

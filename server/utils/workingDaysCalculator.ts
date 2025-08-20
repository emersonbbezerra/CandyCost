/**
 * Utilitário para calcular dias e horas de trabalho baseado nos dias da semana selecionados
 * Baseado em 365 dias por ano para máxima precisão
 */

export interface WorkingDaysConfig {
  workMonday: boolean;
  workTuesday: boolean;
  workWednesday: boolean;
  workThursday: boolean;
  workFriday: boolean;
  workSaturday: boolean;
  workSunday: boolean;
  hoursPerDay: number;
}

export interface WorkingDaysCalculation {
  annualWorkingDays: number;
  annualWorkingHours: number;
  monthlyWorkingHours: number;
  averageWorkingDaysPerMonth: number;
}

/**
 * Calcula os dias úteis baseado na configuração de dias da semana
 * Usa o ano corrente para máxima precisão (considera anos bissextos)
 */
export function calculateWorkingDays(
  config: WorkingDaysConfig
): WorkingDaysCalculation {
  const currentYear = new Date().getFullYear();
  const isLeapYear =
    (currentYear % 4 === 0 && currentYear % 100 !== 0) ||
    currentYear % 400 === 0;
  const daysInYear = isLeapYear ? 366 : 365;

  // Array correspondente aos dias da semana (0 = domingo, 1 = segunda, etc.)
  const workingDaysMap = [
    config.workSunday, // 0 = domingo
    config.workMonday, // 1 = segunda
    config.workTuesday, // 2 = terça
    config.workWednesday, // 3 = quarta
    config.workThursday, // 4 = quinta
    config.workFriday, // 5 = sexta
    config.workSaturday, // 6 = sábado
  ];

  let totalWorkingDays = 0;

  // Conta todos os dias do ano corrente que são dias de trabalho
  for (let dayOfYear = 1; dayOfYear <= daysInYear; dayOfYear++) {
    const date = new Date(currentYear, 0, dayOfYear); // Janeiro = 0
    const dayOfWeek = date.getDay();

    if (workingDaysMap[dayOfWeek]) {
      totalWorkingDays++;
    }
  }

  const annualWorkingHours = totalWorkingDays * config.hoursPerDay;
  const monthlyWorkingHours = annualWorkingHours / 12;
  const averageWorkingDaysPerMonth = totalWorkingDays / 12;

  return {
    annualWorkingDays: totalWorkingDays,
    annualWorkingHours: annualWorkingHours,
    monthlyWorkingHours: monthlyWorkingHours,
    averageWorkingDaysPerMonth: averageWorkingDaysPerMonth,
  };
}

/**
 * Converte configuração antiga (daysPerMonth) para nova configuração
 * Usado para migração e compatibilidade
 */
export function convertLegacyConfiguration(
  daysPerMonth: number,
  hoursPerDay: number
): WorkingDaysConfig {
  // Se trabalha aproximadamente 22 dias por mês, assume seg-sex (5 dias/semana)
  // Se trabalha mais, pode incluir sábado, etc.
  const workingDaysPerWeek = Math.round((daysPerMonth * 12) / 52.14); // 52.14 semanas por ano

  return {
    workMonday: true,
    workTuesday: true,
    workWednesday: true,
    workThursday: true,
    workFriday: true,
    workSaturday: workingDaysPerWeek > 5,
    workSunday: workingDaysPerWeek > 6,
    hoursPerDay: hoursPerDay,
  };
}

/**
 * Valida se pelo menos um dia da semana está selecionado
 */
export function validateWorkingDaysConfig(config: WorkingDaysConfig): boolean {
  return (
    config.workMonday ||
    config.workTuesday ||
    config.workWednesday ||
    config.workThursday ||
    config.workFriday ||
    config.workSaturday ||
    config.workSunday
  );
}

/**
 * Calcula quantos dias de um tipo específico há no ano (ex: quantas segundas-feiras)
 * Útil para debugging e validação
 */
export function getDayCountInYear(dayOfWeek: number, year?: number): number {
  const targetYear = year || new Date().getFullYear();
  const isLeapYear =
    (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
  const daysInYear = isLeapYear ? 366 : 365;

  let count = 0;
  for (let dayOfYear = 1; dayOfYear <= daysInYear; dayOfYear++) {
    const date = new Date(targetYear, 0, dayOfYear);
    if (date.getDay() === dayOfWeek) {
      count++;
    }
  }

  return count;
}

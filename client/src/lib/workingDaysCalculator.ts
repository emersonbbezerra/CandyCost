/**
 * Utilitários para cálculos de dias úteis no frontend
 * Mantém sincronização com a lógica do backend
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
 * Calcula os dias úteis no frontend (mesma lógica do backend)
 */
export function calculateWorkingDaysClient(
  config: WorkingDaysConfig
): WorkingDaysCalculation {
  const currentYear = new Date().getFullYear();
  const isLeapYear =
    (currentYear % 4 === 0 && currentYear % 100 !== 0) ||
    currentYear % 400 === 0;
  const daysInYear = isLeapYear ? 366 : 365;

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

  for (let dayOfYear = 1; dayOfYear <= daysInYear; dayOfYear++) {
    const date = new Date(currentYear, 0, dayOfYear);
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
 * Conta quantos dias estão selecionados
 */
export function countSelectedDays(config: WorkingDaysConfig): number {
  let count = 0;
  if (config.workMonday) count++;
  if (config.workTuesday) count++;
  if (config.workWednesday) count++;
  if (config.workThursday) count++;
  if (config.workFriday) count++;
  if (config.workSaturday) count++;
  if (config.workSunday) count++;
  return count;
}

/**
 * Obtém o nome do dia da semana em português
 */
export function getDayName(
  dayKey: keyof Omit<WorkingDaysConfig, 'hoursPerDay'>
): string {
  const dayNames = {
    workMonday: 'Segunda-feira',
    workTuesday: 'Terça-feira',
    workWednesday: 'Quarta-feira',
    workThursday: 'Quinta-feira',
    workFriday: 'Sexta-feira',
    workSaturday: 'Sábado',
    workSunday: 'Domingo',
  };

  return dayNames[dayKey] || dayKey;
}

/**
 * Obtém a abreviação do dia da semana
 */
export function getDayAbbreviation(
  dayKey: keyof Omit<WorkingDaysConfig, 'hoursPerDay'>
): string {
  const dayAbbreviations = {
    workMonday: 'Seg',
    workTuesday: 'Ter',
    workWednesday: 'Qua',
    workThursday: 'Qui',
    workFriday: 'Sex',
    workSaturday: 'Sáb',
    workSunday: 'Dom',
  };

  return dayAbbreviations[dayKey] || dayKey;
}

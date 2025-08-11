import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currencySymbol: string = 'R$'): string {
  // Mapear símbolos para códigos de moeda e locales
  const currencyMap: Record<string, { currency: string; locale: string }> = {
    'R$': { currency: 'BRL', locale: 'pt-BR' },
    '$': { currency: 'USD', locale: 'en-US' },
    '€': { currency: 'EUR', locale: 'en-US' },
    '£': { currency: 'GBP', locale: 'en-GB' },
    '¥': { currency: 'JPY', locale: 'ja-JP' },
  };

  const currencyConfig = currencyMap[currencySymbol];
  
  if (currencyConfig) {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.currency,
    }).format(value);
  }
  
  // Fallback: formatação simples com símbolo personalizado
  return `${currencySymbol} ${value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'há poucos segundos';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
}

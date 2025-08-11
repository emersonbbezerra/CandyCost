import { useCurrencySymbol } from "@/contexts/SettingsContext";

export function useCurrency() {
  const currencySymbol = useCurrencySymbol();

  const formatCurrency = (value: number): string => {
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
  };

  return {
    currencySymbol,
    formatCurrency
  };
}

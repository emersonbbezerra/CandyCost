import { useCurrencySymbol } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

export function useFormatCurrency() {
  const currencySymbol = useCurrencySymbol();
  
  return (value: number) => formatCurrency(value, currencySymbol);
}

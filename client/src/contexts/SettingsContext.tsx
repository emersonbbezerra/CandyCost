import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface SystemSettings {
  defaultMarginPercentage: number;
  priceIncreaseAlertThreshold: number;
  highCostAlertThreshold: number;
  enableCostAlerts: boolean;
  enablePriceAlerts: boolean;
  currencySymbol: string;
  businessName: string;
}

interface SettingsContextType {
  settings: SystemSettings | null;
  isLoading: boolean;
  currencySymbol: string;
  refetchSettings: () => void;
}

const defaultSettings: SystemSettings = {
  defaultMarginPercentage: 60,
  priceIncreaseAlertThreshold: 20,
  highCostAlertThreshold: 50,
  enableCostAlerts: true,
  enablePriceAlerts: true,
  currencySymbol: "R$",
  businessName: "Minha Confeitaria"
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const currencySymbol = settings?.currencySymbol || defaultSettings.currencySymbol;

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      currencySymbol,
      refetchSettings: refetch
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function useCurrencySymbol() {
  const { currencySymbol } = useSettings();
  return currencySymbol;
}

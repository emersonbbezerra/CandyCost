import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  Percent, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Calculator,
  Bell,
  Info
} from "lucide-react";
import { successToast, errorToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SystemSettings {
  defaultMarginPercentage: number;
  priceIncreaseAlertThreshold: number;
  highCostAlertThreshold: number;
  enableCostAlerts: boolean;
  enablePriceAlerts: boolean;
  autoCalculateMargins: boolean;
  currencySymbol: string;
  businessName: string;
}

const defaultSettings: SystemSettings = {
  defaultMarginPercentage: 60,
  priceIncreaseAlertThreshold: 20,
  highCostAlertThreshold: 50,
  enableCostAlerts: true,
  enablePriceAlerts: true,
  autoCalculateMargins: true,
  currencySymbol: "R$",
  businessName: "Minha Confeitaria"
};

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [dataLoaded, setDataLoaded] = useState(false);
  const queryClient = useQueryClient();

  // Carregar configurações do backend
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Erro ao carregar configurações");
      return response.json();
    }
  });

  // Atualizar configurações quando dados carregarem (apenas uma vez)
  useEffect(() => {
    if (currentSettings && !isLoading && !dataLoaded) {
      setSettings(currentSettings);
      setDataLoaded(true);
    }
  }, [currentSettings, isLoading, dataLoaded]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      const response = await apiRequest("PUT", "/api/settings", newSettings);
      return response.json();
    },
    onSuccess: (savedSettings) => {
      setSettings(savedSettings);
      successToast(
        "Configurações Salvas",
        "Suas preferências foram atualizadas com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      errorToast(
        "Erro ao Salvar",
        error.message || "Não foi possível salvar as configurações. Tente novamente."
      );
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    successToast(
      "Configurações Resetadas",
      "Todas as configurações foram restauradas para os valores padrão."
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-blue-600" />
          Configurações do Sistema
        </h2>
        <p className="text-gray-600 mt-2">
          Personalize o comportamento do sistema de acordo com suas necessidades
        </p>
      </div>

      <div className="space-y-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Nome da Empresa</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                  placeholder="Ex: Doces da Maria"
                />
              </div>
              <div>
                <Label htmlFor="currencySymbol">Símbolo da Moeda</Label>
                <Select 
                  value={settings.currencySymbol} 
                  onValueChange={(value) => setSettings({...settings, currencySymbol: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R$">R$ (Real)</SelectItem>
                    <SelectItem value="$">$ (Dólar)</SelectItem>
                    <SelectItem value="€">€ (Euro)</SelectItem>
                    <SelectItem value="£">£ (Libra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Cálculo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-green-600" />
              Cálculos de Preço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultMargin">Margem Padrão (%)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="defaultMargin"
                    type="number"
                    min="0"
                    max="500"
                    value={settings.defaultMarginPercentage}
                    onChange={(e) => setSettings({...settings, defaultMarginPercentage: parseInt(e.target.value) || 0})}
                  />
                  <Percent className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Margem aplicada automaticamente em novos produtos
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="autoMargins"
                  checked={settings.autoCalculateMargins}
                  onCheckedChange={(checked) => setSettings({...settings, autoCalculateMargins: checked})}
                />
                <Label htmlFor="autoMargins" className="text-sm">
                  Calcular margens automaticamente
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2 text-orange-600" />
              Sistema de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="priceAlerts"
                    checked={settings.enablePriceAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, enablePriceAlerts: checked})}
                  />
                  <Label htmlFor="priceAlerts">Alertas de aumento de preço</Label>
                </div>
                
                {settings.enablePriceAlerts && (
                  <div>
                    <Label htmlFor="priceThreshold">Limite de aumento (%)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="priceThreshold"
                        type="number"
                        min="1"
                        max="100"
                        value={settings.priceIncreaseAlertThreshold}
                        onChange={(e) => setSettings({...settings, priceIncreaseAlertThreshold: parseInt(e.target.value) || 0})}
                      />
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Alertar quando preço aumentar mais que este percentual
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="costAlerts"
                    checked={settings.enableCostAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, enableCostAlerts: checked})}
                  />
                  <Label htmlFor="costAlerts">Alertas de custo elevado</Label>
                </div>
                
                {settings.enableCostAlerts && (
                  <div>
                    <Label htmlFor="costThreshold">Limite de custo ({settings.currencySymbol})</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="costThreshold"
                        type="number"
                        min="1"
                        step="0.01"
                        value={settings.highCostAlertThreshold}
                        onChange={(e) => setSettings({...settings, highCostAlertThreshold: parseFloat(e.target.value) || 0})}
                      />
                      <DollarSign className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Alertar quando custo por unidade for maior que este valor
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Impacto */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Algumas alterações podem afetar cálculos existentes. 
            A margem padrão será aplicada apenas a novos produtos criados após o salvamento.
          </AlertDescription>
        </Alert>

        {/* Botões de Ação */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={saveSettingsMutation.isPending}
          >
            Resetar Padrões
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="min-w-32"
          >
            {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
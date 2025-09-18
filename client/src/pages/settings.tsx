import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { errorToast, successToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCostInvalidation } from "@/hooks/useCostInvalidation";
import { apiRequest } from "@/lib/queryClient";
import {
  calculateWorkingDaysClient,
  getDayAbbreviation,
  validateWorkingDaysConfig,
  type WorkingDaysConfig
} from "@/lib/workingDaysCalculator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Calculator,
  Clock,
  DollarSign,
  Info,
  Percent,
  Settings as SettingsIcon,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface SystemSettings {
  defaultMarginPercentage: number;
  priceIncreaseAlertThreshold: number;
  highCostAlertThreshold: number;
  enableCostAlerts: boolean;
  enablePriceAlerts: boolean;
  currencySymbol: string;
  businessName: string;
}

interface WorkConfiguration {
  workDaysPerWeek?: number; // mantido para compatibilidade temporária
  hoursPerDay: string;
  weeksPerMonth?: string; // mantido para compatibilidade temporária
  // Novos campos para dias da semana
  workMonday: boolean;
  workTuesday: boolean;
  workWednesday: boolean;
  workThursday: boolean;
  workFriday: boolean;
  workSaturday: boolean;
  workSunday: boolean;
  // Campos calculados
  annualWorkingDays?: number;
  annualWorkingHours?: number;
  monthlyWorkingHours?: number;
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

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [workConfig, setWorkConfig] = useState<WorkConfiguration>({
    workDaysPerWeek: 5, // compatibilidade
    hoursPerDay: "8.00",
    weeksPerMonth: "4.0", // compatibilidade
    // Configuração padrão: seg-sex
    workMonday: true,
    workTuesday: true,
    workWednesday: true,
    workThursday: true,
    workFriday: true,
    workSaturday: false,
    workSunday: false,
    // Campos calculados
    annualWorkingDays: 261,
    annualWorkingHours: 2088,
    monthlyWorkingHours: 174,
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const costInvalidation = useCostInvalidation();

  // Verificar se o usuário é admin para determinar quais configurações podem ser alteradas
  const isAdmin = user?.role === 'admin';

  // Calcular estatísticas de trabalho em tempo real
  const workingDaysCalculation = useMemo(() => {
    const workingDaysConfig: WorkingDaysConfig = {
      workMonday: workConfig.workMonday,
      workTuesday: workConfig.workTuesday,
      workWednesday: workConfig.workWednesday,
      workThursday: workConfig.workThursday,
      workFriday: workConfig.workFriday,
      workSaturday: workConfig.workSaturday,
      workSunday: workConfig.workSunday,
      hoursPerDay: parseFloat(workConfig.hoursPerDay) || 8
    };

    return calculateWorkingDaysClient(workingDaysConfig);
  }, [workConfig]);

  // Carregar configurações do backend
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Erro ao carregar configurações");
      return response.json();
    }
  });

  // Carregar configuração de trabalho
  const { data: currentWorkConfig, isLoading: isLoadingWorkConfig } = useQuery({
    queryKey: ["/api/work-config/work-configuration"],
    queryFn: async () => {
      const response = await fetch("/api/work-config/work-configuration");
      if (!response.ok) throw new Error("Erro ao carregar configuração de trabalho");
      return response.json();
    }
  });

  // Atualizar configurações quando dados carregarem (apenas uma vez por carregamento inicial)
  useEffect(() => {
    if (currentSettings && !isLoading && !dataLoaded) {
      setSettings(currentSettings);
      setDataLoaded(true);
    }
  }, [currentSettings, isLoading, dataLoaded]);  // Atualizar configuração de trabalho quando carregar
  useEffect(() => {
    if (currentWorkConfig && !isLoadingWorkConfig) {
      setWorkConfig(currentWorkConfig);
    }
  }, [currentWorkConfig, isLoadingWorkConfig]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      // Escolher rota baseada no papel do usuário
      let endpoint = "/api/settings/personal";
      let settingsToSend = newSettings;

      if (isAdmin) {
        // Admin pode alterar todas as configurações
        endpoint = "/api/settings";
      } else {
        // Usuário comum só pode alterar configurações pessoais
        settingsToSend = {
          enablePriceAlerts: newSettings.enablePriceAlerts,
          enableCostAlerts: newSettings.enableCostAlerts
        } as SystemSettings;
      }

      const response = await apiRequest("PUT", endpoint, settingsToSend);
      return response.json();
    },
    onSuccess: (savedSettings) => {
      // Atualizar o estado com os dados salvos do servidor
      setSettings(savedSettings);

      successToast(
        "Configurações Salvas",
        isAdmin
          ? "Todas as configurações do sistema foram atualizadas!"
          : "Suas preferências pessoais foram atualizadas!"
      );

      // Invalidar apenas queries do dashboard para refletir mudanças
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      // Forçar recarregamento das configurações após um breve delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      }, 500);
    },
    onError: (error: any) => {
      errorToast(
        "Erro ao Salvar",
        error.message || "Não foi possível salvar as configurações. Tente novamente."
      );
    }
  }); const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const saveWorkConfigMutation = useMutation({
    mutationFn: async (newWorkConfig: WorkConfiguration) => {
      // Validar se pelo menos um dia está selecionado
      if (!validateWorkingDaysConfig({
        workMonday: newWorkConfig.workMonday,
        workTuesday: newWorkConfig.workTuesday,
        workWednesday: newWorkConfig.workWednesday,
        workThursday: newWorkConfig.workThursday,
        workFriday: newWorkConfig.workFriday,
        workSaturday: newWorkConfig.workSaturday,
        workSunday: newWorkConfig.workSunday,
        hoursPerDay: parseFloat(newWorkConfig.hoursPerDay) || 8
      })) {
        throw new Error('Pelo menos um dia da semana deve estar selecionado como dia de trabalho');
      }

      // Send only the necessary fields, exclude timestamps and ID
      const { id, createdAt, updatedAt, workDaysPerWeek, weeksPerMonth, annualWorkingDays, annualWorkingHours, monthlyWorkingHours, ...configData } = newWorkConfig as any;

      // Converter hoursPerDay para number
      const cleanConfigData = {
        ...configData,
        hoursPerDay: parseFloat(configData.hoursPerDay) || 8
      };

      const response = await apiRequest("PUT", "/api/work-config/work-configuration", cleanConfigData);
      return response.json();
    },
    onSuccess: (savedConfig) => {
      setWorkConfig(prev => ({ ...prev, ...savedConfig }));

      // Usar o sistema de invalidação centralizado para configuração de trabalho
      costInvalidation.invalidateOnWorkConfigChange();

      successToast(
        "Configuração de Trabalho Salva",
        "As configurações de trabalho foram atualizadas com sucesso! Todos os custos foram recalculados."
      );
    },
    onError: (error: any) => {
      errorToast(
        "Erro ao Salvar",
        error.message || "Não foi possível salvar a configuração de trabalho. Tente novamente."
      );
    }
  });

  // Função para alterar dias da semana
  const handleWorkingDayChange = (day: keyof Omit<WorkConfiguration, 'hoursPerDay' | 'workDaysPerWeek' | 'weeksPerMonth' | 'annualWorkingDays' | 'annualWorkingHours' | 'monthlyWorkingHours'>, value: boolean) => {
    setWorkConfig(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handleSaveWorkConfig = () => {
    saveWorkConfigMutation.mutate(workConfig);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setWorkConfig({
      workDaysPerWeek: 5, // compatibilidade
      hoursPerDay: "8.00",
      weeksPerMonth: "4.0", // compatibilidade
      // Configuração padrão: seg-sex
      workMonday: true,
      workTuesday: true,
      workWednesday: true,
      workThursday: true,
      workFriday: true,
      workSaturday: false,
      workSunday: false,
    });
    successToast(
      "Configurações Resetadas",
      "Todas as configurações foram restauradas para os valores padrão."
    );
  };

  if (isLoading || isLoadingWorkConfig) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl w-full min-w-0 overflow-x-hidden">
      <div className="mb-5">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-blue-600" />
          {isAdmin ? 'Configurações do Sistema' : 'Minhas Preferências'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isAdmin
            ? 'Configure todas as definições do sistema para sua confeitaria'
            : 'Personalize suas preferências de notificações'
          }
        </p>
        {!isAdmin && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Algumas configurações são restritas a administradores. Entre em contato com seu administrador para alterações no sistema.
            </AlertDescription>
          </Alert>
        )}
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
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="Ex: Doces da Maria"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label htmlFor="currencySymbol">Símbolo da Moeda</Label>
                <Select
                  value={settings.currencySymbol}
                  onValueChange={(value) => setSettings({ ...settings, currencySymbol: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
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
            <div>
              <Label htmlFor="defaultMargin">Margem Padrão (%)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="defaultMargin"
                  type="number"
                  min="0"
                  max="500"
                  value={settings.defaultMarginPercentage}
                  onChange={(e) => setSettings({ ...settings, defaultMarginPercentage: parseInt(e.target.value) || 0 })}
                  disabled={!isAdmin}
                />
                <Percent className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Margem aplicada automaticamente em novos produtos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Trabalho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              Configuração de Trabalho
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure os dias da semana que você trabalha e as horas por dia para um cálculo preciso dos custos fixos
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de dias da semana */}
            <div>
              <Label className="text-base font-medium mb-3 block">Dias da Semana que Trabalha</Label>
              <div className="grid grid-cols-7 gap-3">
                {[
                  { key: 'workMonday' as const, label: getDayAbbreviation('workMonday'), fullName: 'Segunda-feira' },
                  { key: 'workTuesday' as const, label: getDayAbbreviation('workTuesday'), fullName: 'Terça-feira' },
                  { key: 'workWednesday' as const, label: getDayAbbreviation('workWednesday'), fullName: 'Quarta-feira' },
                  { key: 'workThursday' as const, label: getDayAbbreviation('workThursday'), fullName: 'Quinta-feira' },
                  { key: 'workFriday' as const, label: getDayAbbreviation('workFriday'), fullName: 'Sexta-feira' },
                  { key: 'workSaturday' as const, label: getDayAbbreviation('workSaturday'), fullName: 'Sábado' },
                  { key: 'workSunday' as const, label: getDayAbbreviation('workSunday'), fullName: 'Domingo' }
                ].map(day => (
                  <div key={day.key} className="flex flex-col items-center">
                    <div className="mb-2">
                      <Switch
                        checked={workConfig[day.key]}
                        onCheckedChange={(checked) => handleWorkingDayChange(day.key, checked)}
                        disabled={!isAdmin}
                      />
                    </div>
                    <span className="text-xs text-center font-medium">{day.label}</span>
                    <span className="text-xs text-gray-500 text-center">{day.fullName}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Selecione todos os dias da semana em que você trabalha na confeitaria
              </p>
            </div>

            {/* Horas por dia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoursPerDay">Horas Trabalhadas por Dia</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="hoursPerDay"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={workConfig.hoursPerDay}
                    onChange={(e) => setWorkConfig(prev => ({ ...prev, hoursPerDay: e.target.value }))}
                    disabled={!isAdmin}
                  />
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Número de horas trabalhadas por dia
                </p>
              </div>
            </div>

            {/* Resumo dos Cálculos */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Resumo dos Cálculos Anuais</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Dias de trabalho por ano:</span>
                  <span className="font-semibold text-blue-800">{workingDaysCalculation.annualWorkingDays} dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Horas de trabalho por ano:</span>
                  <span className="font-semibold text-blue-800">{workingDaysCalculation.annualWorkingHours.toFixed(0)} horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Média de horas por mês:</span>
                  <span className="font-semibold text-blue-800">{workingDaysCalculation.monthlyWorkingHours.toFixed(1)} horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Média de dias por mês:</span>
                  <span className="font-semibold text-blue-800">{workingDaysCalculation.averageWorkingDaysPerMonth.toFixed(1)} dias</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Estes valores são usados para calcular o custo fixo por hora de trabalho com máxima precisão
              </p>
            </div>

            {/* Validação */}
            {!validateWorkingDaysConfig({
              workMonday: workConfig.workMonday,
              workTuesday: workConfig.workTuesday,
              workWednesday: workConfig.workWednesday,
              workThursday: workConfig.workThursday,
              workFriday: workConfig.workFriday,
              workSaturday: workConfig.workSaturday,
              workSunday: workConfig.workSunday,
              hoursPerDay: parseFloat(workConfig.hoursPerDay) || 8
            }) && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Você deve selecionar pelo menos um dia da semana como dia de trabalho.
                  </AlertDescription>
                </Alert>
              )}

            {isAdmin && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveWorkConfig}
                  disabled={saveWorkConfigMutation.isPending || !validateWorkingDaysConfig({
                    workMonday: workConfig.workMonday,
                    workTuesday: workConfig.workTuesday,
                    workWednesday: workConfig.workWednesday,
                    workThursday: workConfig.workThursday,
                    workFriday: workConfig.workFriday,
                    workSaturday: workConfig.workSaturday,
                    workSunday: workConfig.workSunday,
                    hoursPerDay: parseFloat(workConfig.hoursPerDay) || 8
                  })}
                  className="w-full"
                >
                  {saveWorkConfigMutation.isPending ? "Salvando..." : "Salvar Configuração de Trabalho"}
                </Button>
              </div>
            )}
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
                    onCheckedChange={(checked) => setSettings({ ...settings, enablePriceAlerts: checked })}
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
                        onChange={(e) => setSettings({ ...settings, priceIncreaseAlertThreshold: parseInt(e.target.value) || 0 })}
                        disabled={!isAdmin}
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
                    onCheckedChange={(checked) => setSettings({ ...settings, enableCostAlerts: checked })}
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
                        onChange={(e) => setSettings({ ...settings, highCostAlertThreshold: parseFloat(e.target.value) || 0 })}
                        disabled={!isAdmin}
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
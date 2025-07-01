import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Ingredient, PriceHistory } from "@shared/schema";
import { useState } from "react";

interface CostAlert {
  type: "price_increase" | "high_cost" | "critical_ingredient";
  title: string;
  description: string;
  ingredient?: Ingredient;
  percentage?: number;
  severity: "low" | "medium" | "high";
}

export function CostAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: priceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
  });

  // Gerar alertas baseado nos dados
  const generateAlerts = (): CostAlert[] => {
    const alerts: CostAlert[] = [];
    const recentHistory = priceHistory.filter(h => 
      h.ingredientId && new Date(h.createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    // Alertas de aumento de preço (últimos 7 dias)
    recentHistory.forEach(history => {
      const ingredient = ingredients.find(i => i.id === history.ingredientId);
      if (!ingredient) return;

      const oldPrice = parseFloat(history.oldPrice);
      const newPrice = parseFloat(history.newPrice);
      const percentage = ((newPrice - oldPrice) / oldPrice) * 100;

      if (percentage > 20) {
        alerts.push({
          type: "price_increase",
          title: `Aumento significativo detectado`,
          description: `${ingredient.name} aumentou ${percentage.toFixed(1)}% nos últimos 7 dias`,
          ingredient,
          percentage,
          severity: percentage > 50 ? "high" : percentage > 30 ? "medium" : "low"
        });
      }
    });

    // Alertas de ingredientes com custo alto por unidade
    ingredients.forEach(ingredient => {
      const unitCost = parseFloat(ingredient.price) / parseFloat(ingredient.quantity);
      
      // Definir limites baseado na categoria
      const limits = {
        "Chocolates": 50,
        "Especiarias": 30,
        "Oleaginosas": 40,
        "Laticínios": 20,
        "Farinhas": 15,
        "Açúcares": 10,
        "Frutas": 25,
        "Outros": 20
      };

      const limit = limits[ingredient.category as keyof typeof limits] || 20;
      
      if (unitCost > limit) {
        alerts.push({
          type: "high_cost",
          title: `Custo elevado detectado`,
          description: `${ingredient.name} tem custo de ${formatCurrency(unitCost)} por ${ingredient.unit}`,
          ingredient,
          severity: unitCost > limit * 2 ? "high" : "medium"
        });
      }
    });

    return alerts.filter(alert => {
      const alertId = `${alert.type}-${alert.ingredient?.id}`;
      return !dismissedAlerts.has(alertId);
    });
  };

  const alerts = generateAlerts();

  const dismissAlert = (alert: CostAlert) => {
    const alertId = `${alert.type}-${alert.ingredient?.id}`;
    setDismissedAlerts(prev => new Set([...Array.from(prev), alertId]));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "border-red-200 bg-red-50 text-red-800";
      case "medium": return "border-yellow-200 bg-yellow-50 text-yellow-800";
      default: return "border-blue-200 bg-blue-50 text-blue-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "medium": return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      default: return <TrendingUp className="w-4 h-4 text-blue-600" />;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
        Alertas de Custos ({alerts.length})
      </h3>
      
      {alerts.map((alert, index) => (
        <Alert key={index} className={getSeverityColor(alert.severity)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getSeverityIcon(alert.severity)}
              <div>
                <h4 className="font-medium">{alert.title}</h4>
                <AlertDescription className="mt-1">
                  {alert.description}
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alert)}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FIXED_COST_CATEGORIES, RECURRENCE_TYPES } from "@shared/constants";
import type { FixedCost, InsertFixedCost } from "@shared/schema";

interface FixedCostFormProps {
  fixedCost?: FixedCost;
  onSubmit: (data: InsertFixedCost) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function FixedCostForm({ fixedCost, onSubmit, onCancel, isLoading }: FixedCostFormProps) {
  const [formData, setFormData] = useState<InsertFixedCost>({
    name: fixedCost?.name || "",
    category: fixedCost?.category || "",
    value: fixedCost?.value || "0",
    recurrence: fixedCost?.recurrence || "monthly",
    description: fixedCost?.description || "",
    isActive: fixedCost?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof InsertFixedCost, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {fixedCost ? "Editar Custo Fixo" : "Novo Custo Fixo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Aluguel do estabelecimento"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
              {FIXED_COST_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
              {category}
              </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => handleInputChange("value", e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="recurrence">Recorrência *</Label>
            <Select 
              value={formData.recurrence} 
              onValueChange={(value) => handleInputChange("recurrence", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a recorrência" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {RECURRENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição opcional do custo"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Ativo</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : (fixedCost ? "Atualizar" : "Criar")}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
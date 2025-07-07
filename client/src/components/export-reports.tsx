import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Ingredient, PriceHistory, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Table, Upload } from "lucide-react";
import { useState } from "react";

interface ExportData {
  ingredients: Ingredient[];
  products: Product[];
  priceHistory: PriceHistory[];
}

export function ExportReports() {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json">("csv");
  const [selectedReport, setSelectedReport] = useState<"ingredients" | "products" | "history" | "complete">("complete");
  const [isExporting, setIsExporting] = useState(false);

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: priceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
  });

  const exportData: ExportData = {
    ingredients,
    products,
    priceHistory
  };

  const generateCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(",");
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || "";
      }).join(",")
    );
    return [csvHeaders, ...csvRows].join("\n");
  };

  const generateIngredientsCSV = () => {
    const headers = ["id", "name", "category", "quantity", "unit", "price", "brand", "createdAt"];
    return generateCSV(ingredients.map(ing => ({
      ...ing,
      createdAt: formatDate(new Date(ing.createdAt))
    })), headers);
  };

  const generateProductsCSV = () => {
    const headers = ["id", "name", "category", "description", "marginPercentage", "isAlsoIngredient", "createdAt"];
    return generateCSV(products.map(prod => ({
      ...prod,
      createdAt: formatDate(new Date(prod.createdAt))
    })), headers);
  };

  const generateHistoryCSV = () => {
    const headers = ["id", "ingredientId", "productId", "oldPrice", "newPrice", "changeReason", "createdAt"];
    return generateCSV(priceHistory.map(hist => ({
      ...hist,
      createdAt: formatDate(new Date(hist.createdAt))
    })), headers);
  };

  const generateCompleteReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalIngredients: ingredients.length,
        totalProducts: products.length,
        totalPriceChanges: priceHistory.length,
        avgIngredientCost: ingredients.reduce((sum, ing) => sum + parseFloat(ing.price), 0) / ingredients.length
      },
      ingredients: ingredients.map(ing => ({
        ...ing,
        unitCost: parseFloat(ing.price) / parseFloat(ing.quantity)
      })),
      products,
      priceHistory: priceHistory.map(hist => ({
        ...hist,
        percentageChange: hist.oldPrice && hist.newPrice ?
          ((parseFloat(hist.newPrice) - parseFloat(hist.oldPrice)) / parseFloat(hist.oldPrice) * 100).toFixed(2) + "%"
          : null
      }))
    };

    if (selectedFormat === "csv") {
      // Para CSV, gerar um arquivo com múltiplas seções
      const sections = [
        "=== RESUMO ===",
        `Total de Ingredientes,${report.summary.totalIngredients}`,
        `Total de Produtos,${report.summary.totalProducts}`,
        `Total de Alterações de Preço,${report.summary.totalPriceChanges}`,
        `Custo Médio de Ingredientes,${formatCurrency(report.summary.avgIngredientCost)}`,
        "",
        "=== INGREDIENTES ===",
        generateIngredientsCSV(),
        "",
        "=== PRODUTOS ===",
        generateProductsCSV(),
        "",
        "=== HISTÓRICO DE PREÇOS ===",
        generateHistoryCSV()
      ];
      return sections.join("\n");
    }

    return JSON.stringify(report, null, 2);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (selectedFormat === "csv") {
        mimeType = "text/csv";
        switch (selectedReport) {
          case "ingredients":
            content = generateIngredientsCSV();
            filename = `ingredientes_${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "products":
            content = generateProductsCSV();
            filename = `produtos_${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case "history":
            content = generateHistoryCSV();
            filename = `historico_precos_${new Date().toISOString().split('T')[0]}.csv`;
            break;
          default:
            content = generateCompleteReport();
            filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}.csv`;
        }
      } else {
        mimeType = "application/json";
        switch (selectedReport) {
          case "ingredients":
            content = JSON.stringify(ingredients, null, 2);
            filename = `ingredientes_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case "products":
            content = JSON.stringify(products, null, 2);
            filename = `produtos_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case "history":
            content = JSON.stringify(priceHistory, null, 2);
            filename = `historico_precos_${new Date().toISOString().split('T')[0]}.json`;
            break;
          default:
            content = generateCompleteReport();
            filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}.json`;
        }
      }

      // Adicionar BOM UTF-8 para corrigir problemas de codificação no Excel
      if (selectedFormat === "csv") {
        const BOM = "\uFEFF";
        content = BOM + content;
      }

      // Criar e baixar o arquivo
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro ao exportar:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getReportIcon = () => {
    switch (selectedReport) {
      case "ingredients": return <Table className="w-4 h-4" />;
      case "products": return <FileText className="w-4 h-4" />;
      case "history": return <Calendar className="w-4 h-4" />;
      default: return <Upload className="w-4 h-4" />;
    }
  };

  const getReportDescription = () => {
    switch (selectedReport) {
      case "ingredients": return `${ingredients.length} ingredientes cadastrados`;
      case "products": return `${products.length} produtos/receitas cadastrados`;
      case "history": return `${priceHistory.length} alterações de preço registradas`;
      default: return "Relatório completo com todos os dados";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Exportar Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <Select value={selectedReport} onValueChange={(value: any) => setSelectedReport(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete">Relatório Completo</SelectItem>
                <SelectItem value="ingredients">Apenas Ingredientes</SelectItem>
                <SelectItem value="products">Apenas Produtos</SelectItem>
                <SelectItem value="history">Histórico de Preços</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato
            </label>
            <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="json">JSON (Dados)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getReportIcon()}
              <div>
                <p className="font-medium text-gray-900">
                  {selectedReport === "complete" ? "Relatório Completo" :
                    selectedReport === "ingredients" ? "Ingredientes" :
                      selectedReport === "products" ? "Produtos" : "Histórico"}
                </p>
                <p className="text-sm text-gray-600">{getReportDescription()}</p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="min-w-[120px]"
            >
              {isExporting ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Os arquivos serão baixados automaticamente no formato selecionado.
          CSV pode ser aberto no Excel ou Google Sheets.
        </div>
      </CardContent>
    </Card>
  );
}
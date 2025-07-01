import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Database, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Buscar todos os dados das APIs
      const [ingredientsRes, productsRes, historyRes] = await Promise.all([
        apiRequest("GET", "/api/ingredients"),
        apiRequest("GET", "/api/products"),
        apiRequest("GET", "/api/price-history")
      ]);

      const [ingredients, products, priceHistory] = await Promise.all([
        ingredientsRes.json(),
        productsRes.json(),
        historyRes.json()
      ]);

      // Buscar receitas para todos os produtos
      const productsWithRecipes = await Promise.all(
        products.map(async (product: any) => {
          try {
            const response = await apiRequest("GET", `/api/products/${product.id}`);
            return await response.json();
          } catch {
            return product;
          }
        })
      );

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        application: "ConfeiCalc",
        data: {
          ingredients,
          products: productsWithRecipes,
          priceHistory
        },
        metadata: {
          totalIngredients: ingredients.length,
          totalProducts: products.length,
          totalHistoryEntries: priceHistory.length
        }
      };

      // Criar e baixar o arquivo de backup
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `confei-calc-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Criado",
        description: "Backup completo dos dados foi baixado com sucesso!",
      });

    } catch (error) {
      console.error("Erro ao criar backup:", error);
      toast({
        title: "Erro no Backup",
        description: "Não foi possível criar o backup. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Arquivo Inválido",
        description: "Selecione um arquivo JSON válido de backup.",
        variant: "destructive",
      });
    }
  };

  const restoreMutation = useMutation({
    mutationFn: async (backupData: any) => {
      // Esta função seria implementada no backend para restaurar dados
      const response = await apiRequest("POST", "/api/restore", backupData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Restauração Concluída",
        description: "Dados restaurados com sucesso!",
      });
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Erro na Restauração",
        description: "Não foi possível restaurar os dados. Verifique o arquivo.",
        variant: "destructive",
      });
    },
  });

  const handleRestore = async () => {
    if (!selectedFile) return;

    setIsRestoring(true);
    try {
      const fileContent = await selectedFile.text();
      const backupData = JSON.parse(fileContent);

      // Validar estrutura do backup
      if (!backupData.data || !backupData.data.ingredients || !backupData.data.products) {
        throw new Error("Arquivo de backup inválido");
      }

      // Por enquanto, mostrar alerta que seria implementado no backend
      toast({
        title: "Funcionalidade em Desenvolvimento",
        description: "A restauração de backup será implementada na próxima versão. Dados válidos detectados no arquivo.",
      });

    } catch (error) {
      toast({
        title: "Erro na Restauração",
        description: "Arquivo de backup inválido ou corrompido.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            Backup de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Faça backup de todos os ingredientes, produtos, receitas e histórico de preços.
          </p>
          
          <Alert>
            <Database className="w-4 h-4" />
            <AlertDescription>
              O backup inclui todos os dados do sistema em formato JSON, 
              permitindo restauração completa em caso de necessidade.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">O que será incluído:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Todos os ingredientes cadastrados</li>
              <li>• Produtos e suas receitas</li>
              <li>• Histórico completo de alterações de preços</li>
              <li>• Configurações de margem e categorias</li>
            </ul>
          </div>

          <Button 
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full"
          >
            {isBackingUp ? "Criando Backup..." : "Fazer Backup Completo"}
          </Button>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2 text-green-600" />
            Restaurar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Restaure dados de um arquivo de backup anterior.
          </p>

          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A restauração substituirá todos os dados atuais. 
              Faça um backup antes de prosseguir.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="backup-file">Selecionar Arquivo de Backup</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {selectedFile && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Arquivo selecionado: {selectedFile.name}
                <br />
                Tamanho: {(selectedFile.size / 1024).toFixed(1)} KB
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleRestore}
            disabled={!selectedFile || isRestoring}
            variant="destructive"
            className="w-full"
          >
            {isRestoring ? "Restaurando..." : "Restaurar Dados"}
          </Button>

          <p className="text-xs text-gray-500">
            Certifique-se de que o arquivo é um backup válido do ConfeiCalc antes de prosseguir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
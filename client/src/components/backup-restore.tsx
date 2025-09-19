import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { useCostInvalidation } from "@/hooks/useCostInvalidation";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Database, Download, Upload } from "lucide-react";
import { useState } from "react";

export function BackupRestore({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [backupDataToRestore, setBackupDataToRestore] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const costInvalidation = useCostInvalidation();

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
        application: "CandyCost",
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
      link.download = `candycost-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      successToast("Backup Criado", "Backup completo dos dados foi baixado com sucesso!");

    } catch (error) {
      console.error("Erro ao criar backup:", error);
      errorToast("Erro no Backup", "Não foi possível criar o backup. Tente novamente.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
    } else {
      errorToast("Arquivo Inválido", "Selecione um arquivo JSON válido de backup.");
    }
  };

  const restoreMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const response = await apiRequest("POST", "/api/restore-backup", {
        backupData
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar todos os grupos de queries relacionadas a custos
      costInvalidation.invalidateFullRecalculation();

      successToast("Restauração Concluída", `Backup restaurado com sucesso! ${data.restored.ingredients} ingredientes, ${data.restored.products} produtos e ${data.restored.priceHistory} registros de histórico foram restaurados.`);

      // Limpar estados
      setSelectedFile(null);
      setBackupDataToRestore(null);
      setIsRestoring(false);
    },
    onError: (error: any) => {
      errorToast("Erro na Restauração", error.message || "Não foi possível restaurar os dados. Verifique o arquivo.");
    },
  });

  const handleRestore = async () => {
    if (!selectedFile) {
      errorToast("Erro", "Selecione um arquivo de backup para restaurar");
      return;
    }

    try {
      const fileContent = await selectedFile.text();
      const backupData = JSON.parse(fileContent);

      // Validar estrutura do backup
      if (!backupData.application || backupData.application !== "CandyCost") {
        throw new Error("Arquivo de backup inválido - não é um backup do CandyCost");
      }

      if (!backupData.data) {
        throw new Error("Arquivo de backup corrompido - dados não encontrados");
      }

      // Mostrar dados do backup e pedir confirmação
      setBackupDataToRestore(backupData);
      setShowConfirmDialog(true);

    } catch (error: any) {
      errorToast("Erro ao Ler Backup", error.message || "Arquivo de backup inválido ou corrompido.");
    }
  };

  const confirmRestore = () => {
    setShowConfirmDialog(false);
    setIsRestoring(true);
    restoreMutation.mutate(backupDataToRestore);
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
            disabled={isBackingUp || isReadOnly}
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
              disabled={isReadOnly}
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
            disabled={!selectedFile || isRestoring || isReadOnly}
            variant="destructive"
            className="w-full"
          >
            {isRestoring ? "Restaurando..." : "Restaurar Dados"}
          </Button>

          <p className="text-xs text-gray-500">
            Certifique-se de que o arquivo é um backup válido do CandyCost antes de prosseguir.
          </p>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Restauração */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="⚠️ Confirmar Restauração de Backup"
        description={`Esta operação irá SUBSTITUIR TODOS os dados atuais pelos dados do backup.\n\nDados que serão restaurados:\n• ${backupDataToRestore?.data?.ingredients?.length || 0} ingredientes\n• ${backupDataToRestore?.data?.products?.length || 0} produtos/receitas\n• ${backupDataToRestore?.data?.priceHistory?.length || 0} registros de histórico\n\nData do backup: ${backupDataToRestore?.timestamp ? new Date(backupDataToRestore.timestamp).toLocaleString('pt-BR') : 'Não informada'}\n\n❌ ATENÇÃO: Esta ação não pode ser desfeita!\n\n✅ Recomendação: Faça um backup dos dados atuais antes de prosseguir.`}
        confirmText="Sim, Restaurar"
        cancelText="Cancelar"
        onConfirm={confirmRestore}
        variant="destructive"
      />
    </div>
  );
}
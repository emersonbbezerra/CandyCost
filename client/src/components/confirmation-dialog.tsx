import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive"; // força variante do botão de confirmação
  autoDetectDestructive?: boolean; // se true (padrão), detecta palavras-chave para usar destructive automaticamente
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
  autoDetectDestructive = true,
}: ConfirmationDialogProps) {
  // Detecção automática de ação destrutiva
  const lowerAll = `${title} ${description} ${confirmText}`.toLowerCase();
  const keywords = ["excluir", "apagar", "deletar", "remover"];
  const isAutoDestructive = autoDetectDestructive && keywords.some(k => lowerAll.includes(k));
  const effectiveVariant = variant === "destructive" || (variant === "default" && isAutoDestructive)
    ? "destructive"
    : "default";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Não passamos className custom para manter exatamente o estilo base do AlertDialogContent já usado no dialog aprovado */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            variant={effectiveVariant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
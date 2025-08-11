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
  variant?: "default" | "destructive"; // sobrescreve detecção automática
  autoDetectDestructive?: boolean; // se true (padrão), ajusta para destructive quando identificar palavras-chave
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
  autoDetectDestructive = true
}: ConfirmationDialogProps) {
  // Auto detecção se a ação é destrutiva (palavras-chave em português)
  const lowerAll = `${title} ${description} ${confirmText}`.toLowerCase();
  const keywords = ["excluir", "apagar", "deletar", "remover"];
  const isAutoDestructive = autoDetectDestructive && keywords.some(k => lowerAll.includes(k));
  const effectiveVariant = variant === "destructive" || (variant === "default" && isAutoDestructive) ? "destructive" : "default";
  const destructive = effectiveVariant === "destructive";
  const contentClasses = destructive
    ? "bg-gradient-to-br from-red-50 via-rose-50 to-red-50 border border-red-200 shadow-lg"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white border border-blue-100 shadow-lg";
  const titleClasses = destructive
    ? "text-red-700"
    : "text-blue-700";
  const descriptionClasses = destructive
    ? "text-red-600/80"
    : "text-slate-600";
  const cancelBtnClasses = destructive
    ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
    : "border-primary bg-white text-primary hover:bg-blue-light hover:text-primary hover:border-primary";
  const confirmBtnClasses = destructive
    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500 focus-visible:ring-offset-2 text-white shadow-md hover:shadow-lg"
    : "btn-primary-gradient text-white shadow-md hover:shadow-lg";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={contentClasses}>
        <AlertDialogHeader>
          <AlertDialogTitle className={titleClasses}>{title}</AlertDialogTitle>
          <AlertDialogDescription className={descriptionClasses}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={cancelBtnClasses}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={confirmBtnClasses}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
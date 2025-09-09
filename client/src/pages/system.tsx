import { BackupRestore } from "@/components/backup-restore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { Database, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";

export default function System() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-4 lg:p-8 w-full min-w-0 overflow-x-hidden">
      <div className="mb-5">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-600" />
          Backup & Restauração
        </h2>
        <p className="text-gray-600 mt-2">
          {isAdmin
            ? "Gerencie os dados do sistema com backup e restauração completa"
            : "Visualize as opções de backup e restauração do sistema"
          }
        </p>
      </div>

      {!isAdmin && (
        <div className="mb-6">
          <Alert>
            <ShieldAlert className="w-4 h-4" />
            <AlertDescription>
              <strong>Acesso Restrito:</strong> Apenas administradores podem executar operações de backup e restauração.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <BackupRestore isReadOnly={!isAdmin} />
    </div>
  );
}
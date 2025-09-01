import { BackupRestore } from "@/components/backup-restore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Database, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";

export default function System() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            Backup & Restauração
          </h2>
          <p className="text-gray-600 mt-2">Área restrita a administradores do sistema</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-600" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Você não tem permissão para executar operações de backup ou restauração. Entre em contato com um administrador se precisar dessa funcionalidade.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/settings')} className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para Configurações
              </Button>
              <Button onClick={() => navigate('/profile')}>Ir para Meu Perfil</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 w-full min-w-0 overflow-x-hidden">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-600" />
          Backup & Restauração
        </h2>
        <p className="text-gray-600 mt-2">Gerencie os dados do sistema com backup e restauração completa</p>
      </div>
      <BackupRestore />
    </div>
  );
}
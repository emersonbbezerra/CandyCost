import { useLocation } from "wouter";
import { Database } from "lucide-react";
import { BackupRestore } from "@/components/backup-restore";

export default function System() {
  const [location] = useLocation();
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-600" />
          Backup & Restauração
        </h2>
        <p className="text-gray-600 mt-2">Gerencie os dados do sistema com backup e restauração completa</p>
      </div>

      {/* Seção de Backup e Restauração */}
      <BackupRestore />
    </div>
  );
}
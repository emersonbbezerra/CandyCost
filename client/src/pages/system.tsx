import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Database, Users, Shield, Download, Upload, Server } from "lucide-react";
import { BackupRestore } from "@/components/backup-restore";

export default function System() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Sistema</h2>
        <p className="text-gray-600 mt-2">Configurações e gerenciamento do sistema</p>
      </div>

      {/* Grid de funcionalidades do sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Backup e Restauração */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Database className="w-5 h-5 mr-2 text-blue-600" />
              Backup & Restauração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Faça backup completo dos dados do sistema e restaure quando necessário.
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <Download className="w-3 h-3 mr-1" />
              <span>Backup automático disponível</span>
            </div>
          </CardContent>
        </Card>

        {/* Gerenciamento de Usuários - Futuro */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gerencie usuários, permissões e controle de acesso ao sistema.
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <Shield className="w-3 h-3 mr-1" />
              <span>Em breve</span>
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema - Futuro */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure preferências gerais, categorias padrão e parâmetros do sistema.
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <Server className="w-3 h-3 mr-1" />
              <span>Em breve</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção principal de Backup e Restauração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-6 h-6 mr-3 text-blue-600" />
            Backup e Restauração de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Proteção dos Seus Dados</h4>
            <p className="text-sm text-blue-700">
              Mantenha seus dados seguros com backups regulares. O sistema permite exportar todos os 
              ingredientes, receitas, produtos e histórico de preços em um arquivo único que pode ser 
              restaurado a qualquer momento.
            </p>
          </div>
          
          <BackupRestore />
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">Dicas de Segurança</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Faça backups regulares, especialmente antes de grandes alterações</li>
              <li>• Armazene os arquivos de backup em local seguro (nuvem, HD externo)</li>
              <li>• Teste a restauração periodicamente para garantir integridade dos dados</li>
              <li>• Mantenha múltiplas versões de backup de diferentes datas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="w-5 h-5 mr-2 text-gray-600" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">v1.0</div>
              <div className="text-sm text-gray-600">Versão do Sistema</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Ativo</div>
              <div className="text-sm text-gray-600">Status do Sistema</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600">Última Atualização</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
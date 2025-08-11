import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, Crown, Mail, Shield, UserPlus, Users } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export default function UserManagement() {
  const [promoteEmail, setPromoteEmail] = useState("");
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json() as Promise<User[]>;
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/promote-user", { email });
      return response.json();
    },
    onSuccess: (data) => {
      successToast("Usuário promovido com sucesso!", `${data.user.firstName} agora é administrador.`);
      setPromoteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      errorToast("Erro ao promover usuário", error.message || "Ocorreu um erro inesperado");
    },
  });

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteEmail.trim()) {
      errorToast("Email obrigatório", "Digite o email do usuário para promover.");
      return;
    }
    promoteMutation.mutate(promoteEmail.trim());
  };

  const adminUsers = users?.filter(user => user.role === 'admin') || [];
  const regularUsers = users?.filter(user => user.role === 'user') || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e permissões administrativas do sistema CandyCost
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{adminUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usuários Comuns</p>
                <p className="text-2xl font-bold">{regularUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promover usuário */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Promover Usuário a Administrador
          </CardTitle>
          <CardDescription>
            Digite o email de um usuário existente para promovê-lo a administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="usuario@exemplo.com"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                disabled={promoteMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              disabled={promoteMutation.isPending || !promoteEmail.trim()}
            >
              {promoteMutation.isPending ? "Promovendo..." : "Promover"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Administradores */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Administradores ({adminUsers.length})
          </CardTitle>
          <CardDescription>
            Usuários com acesso completo ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum administrador encontrado no sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName || ""}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Criado em {formatDate(new Date(user.createdAt))}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    Administrador
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuários Comuns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Usuários Comuns ({regularUsers.length})
          </CardTitle>
          <CardDescription>
            Usuários com acesso limitado ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum usuário comum encontrado no sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {regularUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName || ""}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Criado em {formatDate(new Date(user.createdAt))}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Usuário
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
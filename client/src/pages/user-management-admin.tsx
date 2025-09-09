import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorToast, successToast, useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, Crown, Edit, KeyRound, Mail, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { passwordErrorMessage, passwordRegex } from "../../../shared/passwordValidation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

const userEditSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().optional(),
  email: z.string().email('Email inválido'),
  role: z.enum(['user', 'admin']),
});

const passwordResetSchema = z.object({
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(passwordRegex, passwordErrorMessage),
  confirmPassword: z.string()
});

const passwordResetSchemaWithConfirm = passwordResetSchema.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});


type UserEditForm = z.infer<typeof userEditSchema>;
type PasswordResetForm = z.infer<typeof passwordResetSchemaWithConfirm>;

export default function UserManagementAdmin() {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Separate users by role
  const adminUsers = users.filter((user: User) => user.role === 'admin');
  const regularUsers = users.filter((user: User) => user.role === 'user');

  // Edit user form
  const editForm = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
  });

  // Password reset form
  const passwordForm = useForm<PasswordResetForm>({
    resolver: zodResolver(passwordResetSchemaWithConfirm),
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UserEditForm }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      successToast("Usuário atualizado!", "As informações do usuário foram atualizadas com sucesso.");
    },
    onError: (error: Error) => {
      errorToast("Erro ao atualizar usuário", error.message);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/reset-password`, {
        newPassword: password,
      });
      return response.json();
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      passwordForm.reset();
      successToast("Senha resetada!", "A senha do usuário foi alterada com sucesso.");
    },
    onError: (error: Error) => {
      errorToast("Erro ao resetar senha", error.message);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      successToast("Usuário excluído!", "O usuário foi removido do sistema.");
    },
    onError: (error: Error) => {
      errorToast("Erro ao excluir usuário", error.message);
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName || "",
      email: user.email,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    passwordForm.reset();
    setPasswordDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const onEditSubmit = (data: UserEditForm) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ userId: selectedUser.id, data });
  };

  const onPasswordSubmit = (data: PasswordResetForm) => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      password: data.newPassword
    });
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatUserName = (user: User | null) => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return lastName ? `${firstName} ${lastName}` : firstName;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar usuários. Verifique se você tem permissões administrativas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 w-full min-w-0 overflow-x-hidden">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3 text-blue-600" />
          Gerenciamento de Usuários
        </h2>
        <p className="text-gray-600 mt-2">Gerencie usuários do sistema CandyCost</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-2xl font-bold">{adminUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600">Usuários Padrão</p>
                <p className="text-2xl font-bold">{regularUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Administradores */}
      <Card className="mb-6 md:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Administradores ({adminUsers.length})
          </CardTitle>
          <CardDescription>
            Usuários com acesso administrativo completo
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
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 md:p-4 border rounded-lg bg-yellow-50 space-y-2 lg:space-y-0"
                >
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName || ""}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center truncate">
                        <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                        Criado em {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end lg:justify-start space-y-1 sm:space-y-0 sm:space-x-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 w-fit">
                      Administrador
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user)}
                        className="flex-1 sm:flex-none"
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Resetar Senha</span>
                        <span className="sm:hidden">Senha</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuários Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-500" />
            Usuários Padrão ({regularUsers.length})
          </CardTitle>
          <CardDescription>
            Usuários com acesso limitado ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum usuário padrão encontrado no sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {regularUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 md:p-4 border rounded-lg space-y-2 lg:space-y-0"
                >
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName || ""}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center truncate">
                        <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                        Criado em {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end lg:justify-start space-y-1 sm:space-y-0 sm:space-x-2">
                    <Badge variant="outline" className="text-green-700 border-green-300 w-fit">
                      Usuário
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user)}
                        className="flex-1 sm:flex-none"
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Resetar Senha</span>
                        <span className="sm:hidden">Senha</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="flex-1 sm:flex-none"
                      >
                        {/* Ícone herdando a cor do texto (removido text-red-600) */}
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
                        <span className="sm:hidden">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário {formatUserName(selectedUser)}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papel no Sistema *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o papel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="user">Usuário Padrão</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Reset de Senha */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {formatUserName(selectedUser)}
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite a nova senha" {...field} />
                    </FormControl>
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      <p>✓ Mínimo 8 caracteres</p>
                      <p>✓ Pelo menos 1 maiúscula (A-Z)</p>
                      <p>✓ Pelo menos 1 minúscula (a-z)</p>
                      <p>✓ Pelo menos 1 número (0-9)</p>
                      <p>✓ Pelo menos 1 símbolo (@$!%*?&#+\-_.=)</p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite a senha novamente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Resetando..." : "Resetar Senha"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${formatUserName(selectedUser)}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
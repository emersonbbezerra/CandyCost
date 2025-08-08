import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, Settings, Lock, CheckCircle } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido"),
});

import { passwordErrorMessage, passwordRegex } from "../../../shared/passwordValidation";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string()
    .min(8, "Nova senha deve ter pelo menos 8 caracteres")
    .regex(passwordRegex, passwordErrorMessage),
  confirmPassword: z.string()
});

const passwordSchemaWithConfirm = passwordSchema.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchemaWithConfirm>;

export default function Profile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user profile
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  // Type the user data
  const user = userData as {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    createdAt: string;
  } | undefined;

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchemaWithConfirm),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const response = await apiRequest("PUT", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form defaults when user data loads
  if (user && !profileForm.formState.isDirty) {
    profileForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
  }

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600">Carregando informações...</p>
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
            Erro ao carregar perfil do usuário. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e segurança</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Informações</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Senha</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu sobrenome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Papel: {user?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura com uma senha forte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite sua senha atual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormLabel>Confirmar Nova Senha *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite a nova senha novamente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
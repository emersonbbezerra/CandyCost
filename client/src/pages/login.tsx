import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { passwordErrorMessage, passwordRegex } from "../../../shared/passwordValidation";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(passwordRegex, passwordErrorMessage),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const { login, register, isLoginPending, isRegisterPending } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false);
  const [registerConfirmVisible, setRegisterConfirmVisible] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    login(data);
  };

  const onRegister = (data: RegisterForm) => {
    register(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="CandyCost" className="h-20 w-auto" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Bem-vindo!</CardTitle>
            <CardDescription className="text-center">
              Faça login ou crie uma nova conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Cadastro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // Trigger validation immediately
                                loginForm.trigger("email");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={loginPasswordVisible ? "text" : "password"}
                                placeholder="Sua senha"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setLoginPasswordVisible(v => !v)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                                aria-label={loginPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {loginPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoginPending}
                    >
                      {isLoginPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </Form>

                {/* Bloco de credenciais removido */}
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Seu nome"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Seu sobrenome"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // Trigger validation immediately
                                registerForm.trigger("email");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Segura</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={registerPasswordVisible ? 'text' : 'password'}
                                placeholder="Crie uma senha forte"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setRegisterPasswordVisible(v => !v)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                                aria-label={registerPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {registerPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
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
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={registerConfirmVisible ? 'text' : 'password'}
                                placeholder="Digite a senha novamente"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  registerForm.trigger('confirmPassword');
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setRegisterConfirmVisible(v => !v)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                                aria-label={registerConfirmVisible ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {registerConfirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isRegisterPending}
                    >
                      {isRegisterPending ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Sistema profissional para gestão de custos</p>
          <p>Controle total dos seus insumos e produtos</p>
        </div>
      </div>
    </div>
  );
}
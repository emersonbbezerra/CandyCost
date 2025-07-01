import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { successToast, errorToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null; // Not authenticated
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return res.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          return null; // Not authenticated
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      successToast(
        "Login realizado com sucesso!",
        `Bem-vindo(a), ${data.user.firstName}!`
      );
    },
    onError: (error: any) => {
      // Remove códigos de status HTTP da mensagem
      let errorMessage = error.message || "Credenciais inválidas";
      
      // Se a mensagem contém código HTTP, extrair apenas a parte útil
      if (errorMessage.includes("401:")) {
        errorMessage = "Email ou senha incorretos. Verifique suas credenciais.";
      } else if (errorMessage.includes("500:")) {
        errorMessage = "Erro interno do servidor. Tente novamente.";
      } else if (errorMessage.includes("400:")) {
        errorMessage = "Dados inválidos. Verifique as informações digitadas.";
      }
      
      errorToast("Erro no login", errorMessage);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      successToast(
        "Conta criada com sucesso!",
        `Bem-vindo(a) ao CandyCost, ${data.user.firstName}!`
      );
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (error: any) => {
      // Remove códigos de status HTTP da mensagem
      let errorMessage = error.message || "Erro ao criar conta";
      
      // Se a mensagem contém código HTTP, extrair apenas a parte útil
      if (errorMessage.includes("400:")) {
        if (errorMessage.includes("Email")) {
          errorMessage = "Este email já está sendo usado. Tente fazer login ou use outro email.";
        } else if (errorMessage.includes("senha")) {
          errorMessage = "A senha não atende aos requisitos de segurança.";
        } else {
          errorMessage = "Dados inválidos. Verifique as informações digitadas.";
        }
      } else if (errorMessage.includes("500:")) {
        errorMessage = "Erro interno do servidor. Tente novamente em alguns instantes.";
      }
      
      errorToast("Erro no cadastro", errorMessage);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Remove user data specifically
      queryClient.setQueryData(["/api/auth/user"], null);
      successToast(
        "Logout realizado",
        "Até logo!"
      );
      // Reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      errorToast(
        "Erro no logout",
        error.message || "Erro ao fazer logout"
      );
      // Even if there's an error, try to clear local state
      queryClient.clear();
      queryClient.setQueryData(["/api/auth/user"], null);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
}
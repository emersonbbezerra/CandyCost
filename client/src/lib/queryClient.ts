import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const responseText = await res.text();
    
    // Primeiro, tentar fazer parse do JSON
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Erro na operação. Tente novamente.");
    }
    
    // Se conseguiu fazer parse, extrair a mensagem
    const message = errorData.message || errorData.error || "Erro na operação";
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Debug: verificar se o método é válido
  if (typeof method !== 'string') {
    console.error('Invalid method type:', typeof method, method);
    throw new Error(`Invalid HTTP method: expected string, got ${typeof method}`);
  }
  
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const upperMethod = method.toUpperCase();
  
  if (!validMethods.includes(upperMethod)) {
    console.error('Invalid method value:', method);
    throw new Error(`Invalid HTTP method: ${method}`);
  }
  
  const res = await fetch(url, {
    method: upperMethod,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

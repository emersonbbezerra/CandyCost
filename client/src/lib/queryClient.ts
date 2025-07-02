import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const responseText = await res.text();
    console.log("DEBUG - Response text:", responseText); // Log para debug
    
    // Primeiro, tentar fazer parse do JSON
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      console.log("DEBUG - Parse error:", parseError, "usando mensagem genérica"); // Log para debug
      throw new Error("Erro na operação. Tente novamente.");
    }
    
    // Se conseguiu fazer parse, extrair a mensagem
    const message = errorData.message || errorData.error || "Erro na operação";
    console.log("DEBUG - Final message:", message); // Log para debug
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";

import type { DemoSession } from "@/interfaces/session";
import { httpClient } from "@/lib/http-client";

type SessionContextValue = {
  isLoading: boolean;
  login: (email: string) => Promise<DemoSession>;
  logout: () => Promise<void>;
  session: DemoSession | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const SESSION_QUERY_KEY = ["session"] as const;

async function fetchSession(): Promise<DemoSession | null> {
  const response = await httpClient.get<DemoSession>("/api/session");
  return response.status === 200 ? response.data : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
  });
  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await httpClient.post<DemoSession>("/api/session", {
        email,
      });
      if (response.status !== 200) {
        const body = response.data as unknown as { message?: string };
        throw new Error(body.message ?? "Login failed.");
      }
      return response.data;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
    },
  });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await httpClient.delete("/api/session");
    },
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });

  return (
    <SessionContext.Provider
      value={{
        isLoading: sessionQuery.isLoading,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        session: sessionQuery.data ?? null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider.");
  }
  return context;
}

export function useDemoSession() {
  return useSession().session;
}

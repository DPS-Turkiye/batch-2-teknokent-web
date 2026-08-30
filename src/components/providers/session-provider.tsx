"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";

import type { AppSession } from "@/interfaces/session";
import { createSession } from "@/lib/client/auth";
import { signOutOfFirebase } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";

type SessionContextValue = {
  isLoading: boolean;
  login: (idToken: string, rememberMe?: boolean) => Promise<AppSession>;
  logout: () => Promise<void>;
  session: AppSession | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const SESSION_QUERY_KEY = ["session"] as const;

async function fetchSession(): Promise<AppSession | null> {
  const response = await httpClient.get<AppSession>("/api/session");
  return response.status === 200 ? response.data : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const loginMutation = useMutation({
    mutationFn: ({
      idToken,
      rememberMe,
    }: {
      idToken: string;
      rememberMe?: boolean;
    }) => createSession(idToken, rememberMe ?? false),
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
    },
  });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await httpClient.delete("/api/session");
      await signOutOfFirebase().catch(() => undefined);
    },
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  return (
    <SessionContext.Provider
      value={{
        isLoading: sessionQuery.isLoading,
        login: (idToken, rememberMe) =>
          loginMutation.mutateAsync({ idToken, rememberMe }),
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

export function useAppSession() {
  return useSession().session;
}

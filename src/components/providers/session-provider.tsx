"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";

import type { AppSession } from "@/interfaces/session";
import { createSession, refreshSession } from "@/lib/client/auth";
import { readSession, signOut } from "@/lib/client/session";
import { signOutOfFirebase } from "@/lib/firebase/auth";
import { isPublicPath, loginPathFor } from "@/lib/public-paths";

type SessionContextValue = {
  isLoading: boolean;
  login: (idToken: string, rememberMe?: boolean) => Promise<AppSession>;
  logout: () => Promise<void>;
  /** Re-reads the account's permissions into the session; null when that isn't possible. */
  refresh: () => Promise<AppSession | null>;
  session: AppSession | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);
export const SESSION_QUERY_KEY = ["session"] as const;

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    // Only "no session" is null; anything else throws, so a hiccup never bounces a signed-in person to login.
    queryFn: readSession,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const loginMutation = useMutation({
    mutationFn: ({
      idToken,
      rememberMe,
    }: {
      idToken: string;
      rememberMe?: boolean | undefined;
    }) => createSession(idToken, rememberMe ?? false),
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
    },
  });
  // A page already open keeps rendering after the session ends elsewhere (a
  // logout in another tab, an expired cookie), so the next check sends it on.
  const pathname = usePathname();
  const router = useRouter();
  const signedOut = sessionQuery.isSuccess && sessionQuery.data === null;
  const leaving = signedOut && !isPublicPath(pathname);
  useEffect(() => {
    if (leaving) router.replace(loginPathFor(pathname));
  }, [leaving, pathname, router]);

  const refreshMutation = useMutation({
    mutationFn: refreshSession,
    onSuccess: (session) => {
      if (session) queryClient.setQueryData(SESSION_QUERY_KEY, session);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
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
        refresh: () => refreshMutation.mutateAsync().catch(() => null),
        session: sessionQuery.data ?? null,
      }}
    >
      {leaving ? null : children}
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

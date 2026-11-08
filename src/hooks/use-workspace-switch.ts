"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  SESSION_QUERY_KEY,
  useAppSession,
} from "@/components/providers/session-provider";
import type { Workspace } from "@/interfaces/workspace";
import { switchWorkspace } from "@/lib/client/auth";
import { workspaceForSession } from "@/lib/role-workspace";
import { activeWorkspaceOf, workspacesOf } from "@/lib/workspaces";

/** The workspaces the signed-in account can switch between; `canSwitch` is false with only one. */
export function useWorkspaceSwitch() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const workspaces = session ? workspacesOf(session) : [];
  const active = session ? activeWorkspaceOf(session) : null;

  const mutation = useMutation({
    mutationFn: (workspace: Workspace) => switchWorkspace(workspace),
    onSuccess: (switched) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, switched);
      router.push(workspaceForSession(switched).homeHref);
      // The layout reads the account type on the server, so the ODTÜ or Teknokent wording has to be fetched again.
      router.refresh();
    },
  });

  return {
    workspaces,
    active,
    canSwitch: workspaces.length > 1,
    isSwitching: mutation.isPending,
    error: mutation.error,
    switchTo: (workspace: Workspace) => {
      if (workspace !== active) mutation.mutate(workspace);
    },
  };
}

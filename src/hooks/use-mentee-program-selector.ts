"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { MENTORS_QUERY_KEY } from "@/hooks/use-mentors";
import {
  useOrganizationPrograms,
  useSetActiveProgram,
} from "@/hooks/use-programs";
import { ToastTone } from "@/interfaces/toast";
import { currentOrganizationProgram } from "@/lib/organization-programs";
import { useToast } from "@/stores/toast-store";

/** Lets a startup in several programs choose whose mentor pool it sees. */
export function useMenteeProgramSelector() {
  const t = useTranslations("mentorsDirectory.program");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const programsQuery = useOrganizationPrograms();
  const setActive = useSetActiveProgram();
  const programs = programsQuery.data?.programs ?? [];
  const current = currentOrganizationProgram(programsQuery.data);

  function select(programId: string) {
    if (!programId || programId === current?.id) return;
    setActive.mutate(programId, {
      // No success toast: the selector shows the chosen program and the list reloads under it.
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: MENTORS_QUERY_KEY });
        // Server-rendered lists (the request wizard's mentors, the Startup'ım header) reload too.
        router.refresh();
      },
      onError: (error) =>
        showToast({
          message: error instanceof Error ? error.message : t("switchFailed"),
          tone: ToastTone.Error,
        }),
    });
  }

  return {
    visible: programs.length > 1,
    programs,
    currentId: current?.id ?? "",
    switching: setActive.isPending,
    select,
  };
}

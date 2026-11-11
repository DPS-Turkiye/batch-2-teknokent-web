"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  decideProgramInvitation,
  getOrganizationPrograms,
  getProgramDetail,
  getProgramInvitations,
  getProgramNames,
  getPrograms,
  setActiveProgram,
} from "@/lib/client/programs";
import { PROGRAM_DETAIL_QUERY_KEY } from "@/lib/const/programs";

export const PROGRAMS_QUERY_KEY = ["programs"] as const;
export const PROGRAM_INVITATIONS_QUERY_KEY = ["program-invitations"] as const;
export const PROGRAM_NAMES_QUERY_KEY = ["program-names"] as const;
export const ORGANIZATION_PROGRAMS_QUERY_KEY = [
  "organization-programs",
] as const;

export function useProgramNames() {
  return useQuery({
    queryKey: PROGRAM_NAMES_QUERY_KEY,
    queryFn: getProgramNames,
  });
}

export function useOrganizationPrograms({ enabled = true } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_PROGRAMS_QUERY_KEY,
    queryFn: getOrganizationPrograms,
    enabled,
  });
}

export function useSetActiveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActiveProgram,
    onSuccess: (data) =>
      queryClient.setQueryData(ORGANIZATION_PROGRAMS_QUERY_KEY, data),
  });
}

export function usePrograms({ enabled = true } = {}) {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    enabled,
  });
}

export function useProgramDetail(programId: string | null) {
  return useQuery({
    queryKey: [PROGRAM_DETAIL_QUERY_KEY, programId],
    queryFn: () => getProgramDetail(programId!),
    enabled: Boolean(programId),
  });
}

export function useProgramInvitations() {
  return useQuery({
    queryKey: PROGRAM_INVITATIONS_QUERY_KEY,
    queryFn: getProgramInvitations,
  });
}

export function useDecideProgramInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      accepted,
    }: {
      programId: string;
      accepted: boolean;
    }) => decideProgramInvitation(programId, accepted),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRAM_INVITATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY });
    },
  });
}

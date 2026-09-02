"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addProgramStartup,
  createProgram,
  decideProgramInvitation,
  decideProgramMentorRequest,
  getOrganizationPrograms,
  getProgramNames,
  getProgramDirectory,
  getProgramInvitations,
  getPrograms,
  inviteProgramMentor,
  removeProgramStartup,
  requestProgramMembership,
  setActiveProgram,
} from "@/lib/client/programs";

export const PROGRAMS_QUERY_KEY = ["programs"] as const;
export const PROGRAM_DIRECTORY_QUERY_KEY = ["program-directory"] as const;
export const PROGRAM_INVITATIONS_QUERY_KEY = ["program-invitations"] as const;
export const PROGRAM_NAMES_QUERY_KEY = ["program-names"] as const;
export const ORGANIZATION_PROGRAMS_QUERY_KEY = [
  "organization-programs",
] as const;

/** Program names for the signup picker, before the visitor has an account. */
export function useProgramNames() {
  return useQuery({
    queryKey: PROGRAM_NAMES_QUERY_KEY,
    queryFn: getProgramNames,
  });
}

/** The signed-in startup's own program assignments and its active choice. */
export function useOrganizationPrograms() {
  return useQuery({
    queryKey: ORGANIZATION_PROGRAMS_QUERY_KEY,
    queryFn: getOrganizationPrograms,
  });
}

export function useSetActiveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActiveProgram,
    // The response is the freshly-read list, so seed the cache with it rather
    // than invalidating and paying for a second round trip.
    onSuccess: (data) =>
      queryClient.setQueryData(ORGANIZATION_PROGRAMS_QUERY_KEY, data),
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
  });
}

export function useProgramDirectory() {
  return useQuery({
    queryKey: PROGRAM_DIRECTORY_QUERY_KEY,
    queryFn: getProgramDirectory,
  });
}

export function useProgramInvitations() {
  return useQuery({
    queryKey: PROGRAM_INVITATIONS_QUERY_KEY,
    queryFn: getProgramInvitations,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProgram,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useAddProgramStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      organizationId,
    }: {
      programId: string;
      organizationId: string;
    }) => addProgramStartup(programId, organizationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useRemoveProgramStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      organizationId,
    }: {
      programId: string;
      organizationId: string;
    }) => removeProgramStartup(programId, organizationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useInviteProgramMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      mentorId,
    }: {
      programId: string;
      mentorId: string;
    }) => inviteProgramMentor(programId, mentorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useRequestProgramMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestProgramMembership,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useDecideProgramMentorRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      mentorId,
      accepted,
    }: {
      programId: string;
      mentorId: string;
      accepted: boolean;
    }) => decideProgramMentorRequest(programId, mentorId, accepted),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSession } from "@/components/providers/session-provider";
import {
  addOrganizationMember,
  getOrganizationMembers,
} from "@/lib/client/organization-members";
import { isFounder } from "@/lib/startup-team";

export const ORGANIZATION_MEMBERS_QUERY_KEY = ["organization-members"] as const;

export function useOrganizationMembers() {
  return useQuery({
    queryKey: ORGANIZATION_MEMBERS_QUERY_KEY,
    queryFn: getOrganizationMembers,
  });
}

export function useViewerIsFounder() {
  const session = useAppSession();
  const { data } = useOrganizationMembers();
  return isFounder(data ?? [], session?.userId);
}

export function useAddOrganizationMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addOrganizationMember,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ORGANIZATION_MEMBERS_QUERY_KEY,
      }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addOrganizationMember,
  getOrganizationMembers,
} from "@/lib/client/organization-members";

export const ORGANIZATION_MEMBERS_QUERY_KEY = ["organization-members"] as const;

export function useOrganizationMembers() {
  return useQuery({
    queryKey: ORGANIZATION_MEMBERS_QUERY_KEY,
    queryFn: getOrganizationMembers,
  });
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

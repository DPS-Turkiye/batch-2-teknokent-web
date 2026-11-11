"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { ClientApiError } from "@/lib/client/api";
import { getPersonSummary } from "@/lib/client/person-summary";
import { isAdminArea } from "@/lib/utils";

export const personSummaryQueryKey = (userId: string) =>
  ["person-summary", userId] as const;

function isNotFound(error: unknown) {
  return error instanceof ClientApiError && error.status === 404;
}

/** The profile page: who the person is, plus where "back" and the program links lead in this frame. */
export function usePersonSummary(userId: string) {
  const admin = isAdminArea(usePathname());
  const router = useRouter();
  const query = useQuery({
    queryKey: personSummaryQueryKey(userId),
    queryFn: () => getPersonSummary(userId),
    retry: (failures, error) => !isNotFound(error) && failures < 1,
  });
  const programsHref = admin ? "/admin/programs" : "/coordinator/programs";
  const listHref = admin ? "/admin/users" : programsHref;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(listHref);
  }

  return {
    query,
    summary: query.data ?? null,
    notFound: isNotFound(query.error),
    listHref,
    programHref: (programId: string) =>
      `${programsHref}/${encodeURIComponent(programId)}`,
    goBack,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { listDocumentRequests } from "@/lib/client/document-requests";
import { mentorshipFileRow } from "@/lib/mentor-dashboard";

export function mentorshipFilesQueryKey(mentorshipRequestId: string) {
  return ["document-requests", "mentorship-request", mentorshipRequestId];
}

/** The files asked of one startup; only fetched once its card is opened. */
export function useMentorshipFiles(
  mentorshipRequestId: string,
  enabled: boolean,
) {
  const t = useTranslations("mentorHome");
  const locale = useLocale();
  const query = useQuery({
    queryKey: mentorshipFilesQueryKey(mentorshipRequestId),
    queryFn: () => listDocumentRequests({ mentorshipRequestId }),
    enabled,
  });

  return {
    files: (query.data ?? []).map((item) =>
      mentorshipFileRow(item, { t, locale }),
    ),
    isLoading: query.isLoading,
    hasFailed: Boolean(query.error),
  };
}

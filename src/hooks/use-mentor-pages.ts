"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { loadMentorPage, loadMentorSlots } from "@/lib/client/mentor-pages";
import { loadStartupContext } from "@/lib/client/startup-context";

/** A mentor's profile page: who the mentor is (null when the caller may not see them) and their open times. */
export function useMentorPage(mentorId: string) {
  const page = useQuery({
    queryKey: ["mentor-page", mentorId],
    queryFn: () => loadMentorPage(mentorId),
  });
  const slots = useQuery({
    queryKey: ["mentor-page", mentorId, "slots"],
    queryFn: () => loadMentorSlots(mentorId),
  });
  return {
    isLoading: page.isPending || slots.isPending,
    page: page.data ?? null,
    slots: slots.data ?? [],
  };
}

/** What mentor matching knows about the caller's startup; nothing to load without one. */
export function useStartupContext(organizationId: string | undefined) {
  const t = useTranslations("loadErrors");
  const fallbackName = t("startupFallbackName");
  const query = useQuery({
    queryKey: ["startup-context", organizationId, fallbackName],
    queryFn: () => loadStartupContext(organizationId ?? "", fallbackName),
    enabled: Boolean(organizationId),
  });
  return {
    isLoading: Boolean(organizationId) && query.isPending,
    startup: query.data?.startup ?? null,
    error: query.data?.error,
  };
}

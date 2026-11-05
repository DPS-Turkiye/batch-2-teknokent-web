"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SESSION_QUERY_KEY } from "@/components/providers/session-provider";
import { STARTUP_PROFILE_QUERY_KEY } from "@/hooks/use-startup-profile";
import type { AppSession } from "@/interfaces/session";
import { joinStartup, resubmitStartup } from "@/lib/client/organization";
import { errorMessage } from "@/lib/utils";

/** The session now carries the startup, so every startup-scoped query starts over. */
export function useAdoptStartupSession() {
  const queryClient = useQueryClient();
  return (session: AppSession) => {
    queryClient.setQueryData(SESSION_QUERY_KEY, session);
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0],
    });
  };
}

/** "Kodum var" on /startup: joins a startup of the person's program at once. */
export function useJoinStartup() {
  const t = useTranslations("startupStart");
  const adopt = useAdoptStartupSession();
  const [code, setCode] = useState("");
  const join = useMutation({
    mutationFn: () => joinStartup(code.trim()),
    onSuccess: adopt,
  });
  return {
    code,
    setCode: (value: string) => {
      setCode(value);
      join.reset();
    },
    canJoin: code.trim().length > 0 && !join.isPending,
    joining: join.isPending,
    error: join.error ? errorMessage(join.error, t("joinFailed")) : null,
    submit: () => join.mutate(),
  };
}

/** A rejected startup's founder sends it back to the coordinator. */
export function useResubmitStartup() {
  const t = useTranslations("startupStart");
  const queryClient = useQueryClient();
  const resubmit = useMutation({
    mutationFn: resubmitStartup,
    onSuccess: (profile) =>
      queryClient.setQueryData(STARTUP_PROFILE_QUERY_KEY, profile),
  });
  return {
    resubmit: () => resubmit.mutate(),
    resubmitting: resubmit.isPending,
    error: resubmit.error
      ? errorMessage(resubmit.error, t("resubmitFailed"))
      : null,
  };
}

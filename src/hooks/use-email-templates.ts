"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useEmailOptions } from "@/hooks/use-email-campaigns";
import type { EmailDraft } from "@/interfaces/email-center";
import { getEmailTemplates } from "@/lib/client/email-center";
import { draftFromTemplate, EMPTY_EMAIL_DRAFT } from "@/lib/email-center";

/** A program's ready texts; its name and the sender's are already in them. */
export function useEmailTemplatesQuery(programId: string) {
  return useQuery({
    queryKey: ["email-templates", programId],
    queryFn: () => getEmailTemplates(programId),
    enabled: programId !== "",
  });
}

/** The "Şablonlar" section: the first program until another one is picked. */
export function useEmailTemplates() {
  const options = useEmailOptions();
  const [picked, setPicked] = useState<string | null>(null);
  const programs = options.data?.programs ?? [];
  const programId = picked ?? programs[0]?.id ?? "";
  const templates = useEmailTemplatesQuery(programId);
  return {
    programs,
    programId,
    pickProgram: setPicked,
    templates: templates.data ?? [],
    isLoading: options.isLoading || templates.isLoading,
    hasNoProgram: options.isSuccess && programs.length === 0,
    error: options.error ?? templates.error,
  };
}

/** What a new mail starts with; `null` while the chosen template is being loaded. */
export function useEmailStart(programId: string, templateKey: string) {
  const templates = useEmailTemplatesQuery(templateKey ? programId : "");
  const template = templates.data?.find((row) => row.key === templateKey);
  const start: EmailDraft | null = templates.isLoading
    ? null
    : template
      ? draftFromTemplate(programId, template)
      : EMPTY_EMAIL_DRAFT;
  // A later refetch that fails must not take a half-written mail off the screen.
  return { start, error: templates.data ? null : templates.error };
}

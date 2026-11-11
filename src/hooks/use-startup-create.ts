"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useStartupAccess } from "@/hooks/use-startup-access";
import {
  emptySignupDraft,
  startupRequestFields,
  useStartupDraftEditors,
} from "@/hooks/use-startup-draft";
import { useAdoptStartupSession } from "@/hooks/use-startup-membership";
import type { AppSession } from "@/interfaces/session";
import {
  MAX_SUPPORT_AREAS,
  StartupDocumentKind,
  type SignupDraft,
} from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import { createStartup } from "@/lib/client/organization";
import { isEnumValue } from "@/lib/enum";
import { StartupAccess } from "@/lib/startup-access";
import { errorMessage, scrollToTop } from "@/lib/utils";

export enum StartupCreateStep {
  Profile = "PROFILE",
  Documents = "DOCUMENTS",
}

function founderDraft(session: AppSession | null): SignupDraft {
  const draft = emptySignupDraft();
  draft.personal.firstName = session?.fullName ?? "";
  draft.personal.role = session?.jobTitle ?? "";
  return draft;
}

/** "Startup'ımı oluştur": the signup's startup step and documents step, for someone who skipped them. */
export function useStartupCreate() {
  const t = useTranslations("startupStart");
  const router = useRouter();
  const { session } = useSession();
  const { access } = useStartupAccess();
  const adopt = useAdoptStartupSession();
  const [draft, setDraft] = useState(() => founderDraft(session));
  const [step, setStep] = useState(StartupCreateStep.Profile);
  const editors = useStartupDraftEditors(setDraft);

  useEffect(() => {
    scrollToTop();
  }, [step]);

  const create = useMutation({
    mutationFn: async () => {
      const next = await createStartup(startupRequestFields(draft));
      // The startup exists now; a failed upload can be retried from its Dosyalar tab.
      try {
        if (draft.startup.logo?.file) {
          await uploadDocument(draft.startup.logo.file, DocumentKind.Logo);
        }
        for (const [kind, uploaded] of Object.entries(draft.documents)) {
          if (uploaded.file && isEnumValue(StartupDocumentKind, kind)) {
            await uploadDocument(uploaded.file, kind);
          }
        }
        return { session: next, destination: "/startup" };
      } catch {
        return { session: next, destination: "/startup/files" };
      }
    },
    onSuccess: ({ session: next, destination }) => {
      adopt(next);
      router.push(destination);
    },
  });

  // Someone who already has a startup has nothing to create here; a fresh one is sent on by onSuccess.
  const leave = access !== StartupAccess.None && !create.isSuccess;
  useEffect(() => {
    if (leave) router.replace("/startup");
  }, [leave, router]);

  const { name, tagline } = draft.startup;
  return {
    ...editors,
    draft,
    step,
    supportAreaLimitReached:
      draft.startup.supportAreas.length >= MAX_SUPPORT_AREAS,
    canContinue: Boolean(name.trim() && tagline.trim()),
    goToDocuments: () => setStep(StartupCreateStep.Documents),
    goToProfile: () => setStep(StartupCreateStep.Profile),
    submit: () => create.mutate(),
    submitting: create.isPending,
    error: create.error ? errorMessage(create.error, t("createFailed")) : null,
  };
}

"use client";

import { useCallback, useState } from "react";

import type { RegisteredAccount } from "@/interfaces/auth";
import type { SignupDraft } from "@/interfaces/signup";
import { startupRequestFields } from "@/hooks/use-startup-draft";
import { registerFounder } from "@/lib/client/auth";
import { uploadDocument } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";

export function signupFullName(draft: SignupDraft) {
  return [draft.personal.firstName, draft.personal.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** Registers the founder (with their startup, or into the program without one), then uploads the files. */
export function useFounderApplication(account: RegisteredAccount) {
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  const submitApplication = useCallback(
    async (draft: SignupDraft) => {
      const idToken = await currentIdToken();
      if (!idToken) {
        throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
      }
      const { programId, startupLater } = draft.startup;
      if (!programId) throw new Error("Lütfen bir program seçin.");
      const personal = {
        fullName: signupFullName(draft) || account.fullName,
        email: account.email,
        phone: account.phone || undefined,
        jobTitle: draft.personal.role.trim() || undefined,
        programId,
        bio: draft.personal.bio.trim() || undefined,
        linkedinUrl: draft.personal.linkedin.trim() || undefined,
        contactPreferences: draft.personal.contactPreferences,
      };

      if (startupLater) {
        await registerFounder({ ...personal, startupLater: true }, idToken);
      } else {
        const { name, ...startupFields } = startupRequestFields(draft);
        await registerFounder(
          { ...personal, ...startupFields, organizationName: name },
          idToken,
        );
      }
      if (draft.personal.cv?.file) {
        await uploadDocument(draft.personal.cv.file, "cv", idToken);
      }
      // Without a startup there is nowhere for its logo and files to go yet.
      if (!startupLater) {
        if (draft.startup.logo?.file) {
          await uploadDocument(draft.startup.logo.file, "logo", idToken);
        }
        for (const [kind, uploaded] of Object.entries(draft.documents)) {
          if (uploaded?.file) {
            await uploadDocument(uploaded.file, kind, idToken);
          }
        }
      }
      setSubmittedAt(new Date());
    },
    [account],
  );

  return { submitApplication, submittedAt };
}

"use client";

import { useCallback, useState } from "react";

import type { RegisteredAccount } from "@/interfaces/auth";
import type { SignupDraft } from "@/interfaces/signup";
import { registerFounder } from "@/lib/client/auth";
import { uploadDocument } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";

export function signupFullName(draft: SignupDraft) {
  return [draft.personal.firstName, draft.personal.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** Registers the founder's startup from the wizard draft, then uploads its files. */
export function useFounderApplication(account: RegisteredAccount) {
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  const submitApplication = useCallback(
    async (draft: SignupDraft) => {
      const idToken = await currentIdToken();
      if (!idToken) {
        throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
      }
      const year = Number(draft.startup.foundedYear);

      await registerFounder(
        {
          fullName: signupFullName(draft) || account.fullName,
          email: account.email,
          phone: account.phone || undefined,
          organizationName: draft.startup.name.trim(),
          description: draft.startup.tagline.trim() || undefined,
          jobTitle: draft.personal.role.trim() || undefined,
          programId: draft.startup.programId,
          bio: draft.personal.bio.trim() || undefined,
          linkedinUrl: draft.personal.linkedin.trim() || undefined,
          website: draft.startup.website.trim() || undefined,
          maturity: draft.startup.maturity || undefined,
          supportAreas: draft.startup.supportAreas,
          contactPreferences: draft.personal.contactPreferences,
          mvpUrl: draft.mvpUrl.trim() || undefined,
          foundedYear: year >= 1900 && year <= 2100 ? year : undefined,
          teamMembers: draft.startup.teamMembers.map((member) => ({
            fullName: member.fullName,
            jobTitle: member.jobTitle || undefined,
            email: member.email || undefined,
          })),
        },
        idToken,
      );
      if (draft.personal.cv?.file) {
        await uploadDocument(draft.personal.cv.file, "cv", idToken);
      }
      if (draft.startup.logo?.file) {
        await uploadDocument(draft.startup.logo.file, "logo", idToken);
      }
      for (const [kind, uploaded] of Object.entries(draft.documents)) {
        if (uploaded?.file) {
          await uploadDocument(uploaded.file, kind, idToken);
        }
      }
      setSubmittedAt(new Date());
    },
    [account],
  );

  return { submitApplication, submittedAt };
}

"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { startupRequestFields } from "@/hooks/use-startup-draft";
import type { RegisteredAccount } from "@/interfaces/auth";
import { StartupDocumentKind, type SignupDraft } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import { ClientApiError } from "@/lib/client/api";
import { registerFounder } from "@/lib/client/auth";
import { uploadDocument } from "@/lib/client/documents";
import { isEnumValue, isOneOf } from "@/lib/enum";
import { invalidFieldNames } from "@/lib/field-errors";
import { currentIdToken } from "@/lib/firebase/auth";

/** Request fields the wizard can name when the backend refuses one; others are shown as sent. */
const NAMED_FIELDS = [
  "fullName",
  "email",
  "phone",
  "jobTitle",
  "bio",
  "linkedinUrl",
  "contactPreferences",
  "programId",
  "organizationName",
  "description",
  "website",
  "mvpUrl",
  "foundedYear",
  "maturity",
  "supportAreas",
  "teamMembers",
] as const;

export function signupFullName(draft: SignupDraft) {
  return [draft.personal.firstName, draft.personal.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** Registers the founder (with their startup, or into the program without one), then uploads the files. */
export function useFounderApplication(account: RegisteredAccount) {
  const tErrors = useTranslations("clientErrors");
  const tWizard = useTranslations("signupWizard");
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  // A validation 400 names its fields; the generic "check the fields" leaves the founder guessing which.
  const namingFields = useCallback(
    (error: unknown) => {
      if (!(error instanceof ClientApiError)) return error;
      const names = invalidFieldNames(error.fieldErrors);
      if (names.length === 0) return error;
      const fields = names
        .map((name) =>
          isOneOf(NAMED_FIELDS, name) ? tWizard(`fieldNames.${name}`) : name,
        )
        .join(", ");
      return new Error(tWizard("invalidFields", { fields }));
    },
    [tWizard],
  );

  const sendApplication = useCallback(
    async (draft: SignupDraft) => {
      const idToken = await currentIdToken();
      if (!idToken) {
        throw new Error(tErrors("sessionExpired"));
      }
      const { programId, startupLater } = draft.startup;
      if (!programId) throw new Error(tWizard("programRequired"));
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
        await uploadDocument(draft.personal.cv.file, DocumentKind.Cv, idToken);
      }
      // Without a startup there is nowhere for its logo and files to go yet.
      if (!startupLater) {
        if (draft.startup.logo?.file) {
          await uploadDocument(
            draft.startup.logo.file,
            DocumentKind.Logo,
            idToken,
          );
        }
        for (const [kind, uploaded] of Object.entries(draft.documents)) {
          if (uploaded.file && isEnumValue(StartupDocumentKind, kind)) {
            await uploadDocument(uploaded.file, kind, idToken);
          }
        }
      }
      setSubmittedAt(new Date());
    },
    [account, tErrors, tWizard],
  );

  const submitApplication = useCallback(
    async (draft: SignupDraft) => {
      try {
        await sendApplication(draft);
      } catch (error) {
        throw namingFields(error);
      }
    },
    [namingFields, sendApplication],
  );

  return { submitApplication, submittedAt };
}

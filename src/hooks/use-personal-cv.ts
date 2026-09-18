"use client";

import { toCvParseResult } from "@/hooks/use-cv-parse";
import { useCvFile } from "@/hooks/use-cv-file";
import type { UserProfileInput } from "@/interfaces/user-profile";
import { readCv } from "@/lib/client/profile-analysis";
import { applyCvParse } from "@/lib/cv-suggestions";

const PROFILE_BIO_MAX_LENGTH = 5000;

type SetField = <K extends keyof UserProfileInput>(
  field: K,
  value: UserProfileInput[K],
) => void;

/** The CV section of the personal profile's edit mode. */
export function usePersonalCv(
  draft: UserProfileInput | null,
  setField: SetField,
) {
  const cv = useCvFile({
    read: async (source) => toCvParseResult(await readCv(source)),
    onRead: (parsed) => {
      if (!draft) return;
      const next = applyCvParse(
        {
          role: draft.jobTitle ?? "",
          bio: draft.bio ?? "",
          expertise: draft.expertise,
        },
        parsed,
        { keepFilled: false, bioMaxLength: PROFILE_BIO_MAX_LENGTH },
      );
      setField("jobTitle", next.role);
      setField("bio", next.bio);
      setField("expertise", next.expertise);
    },
  });

  return {
    ...cv,
    expertise: draft?.expertise ?? [],
    setExpertise: (values: string[]) => setField("expertise", values),
  };
}

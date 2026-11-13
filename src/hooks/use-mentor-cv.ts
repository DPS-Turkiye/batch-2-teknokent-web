"use client";

import { useCvFile } from "@/hooks/use-cv-file";
import { ProfileAnalysisType } from "@/interfaces/profile-analysis";
import { readCv } from "@/lib/client/profile-analysis";
import { toMentorCvResult, type MentorCvResult } from "@/lib/mentor-cv";

/** The CV section of the mentor profile's edit mode, read as a mentor's CV. */
export function useMentorCv(applyCv: (cv: MentorCvResult) => void) {
  return useCvFile({
    read: async (source, consentAccepted) =>
      toMentorCvResult(
        await readCv(source, consentAccepted, ProfileAnalysisType.Mentor),
      ),
    onRead: applyCv,
  });
}

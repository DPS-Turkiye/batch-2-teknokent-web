"use client";

import { useCvFile } from "@/hooks/use-cv-file";
import { readCv } from "@/lib/client/profile-analysis";
import { type MentorCvResult, toMentorCvResult } from "@/lib/mentor-cv";

/** The CV section of the mentor profile's edit mode, read as a mentor's CV. */
export function useMentorCv(applyCv: (cv: MentorCvResult) => void) {
  return useCvFile({
    read: async (source) => toMentorCvResult(await readCv(source, "mentor")),
    onRead: applyCv,
  });
}

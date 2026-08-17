"use client";

import { useMemo } from "react";

import { MENTOR_REQUEST_MENTORS } from "@/lib/const";

export function useMentorRequest(excludedMentor: string | null) {
  const mentors = useMemo(
    () =>
      excludedMentor
        ? MENTOR_REQUEST_MENTORS.filter(
            (mentor) => mentor.name !== excludedMentor,
          )
        : MENTOR_REQUEST_MENTORS,
    [excludedMentor],
  );

  return { mentors };
}

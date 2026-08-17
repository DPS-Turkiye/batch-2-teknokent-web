"use client";

import { useMemo, useState } from "react";

import {
  LANDING_ANNOUNCEMENTS,
  LANDING_FAQS,
  LANDING_MENTOR_STEPS,
  LANDING_PROGRAMS,
  LANDING_TRAINING_CATEGORIES,
  LANDING_TRAININGS,
} from "@/lib/const";
import type { LandingTrainingCategory } from "@/types/landing";

export type { LandingTrainingCategory } from "@/types/landing";

export function useLandingPage() {
  const [trainingFilter, setTrainingFilter] =
    useState<LandingTrainingCategory>("Tümü");

  const visibleTrainings = useMemo(
    () =>
      trainingFilter === "Tümü"
        ? LANDING_TRAININGS
        : LANDING_TRAININGS.filter(
            (training) => training.category === trainingFilter,
          ),
    [trainingFilter],
  );

  return {
    announcements: LANDING_ANNOUNCEMENTS,
    mentorSteps: LANDING_MENTOR_STEPS,
    programs: LANDING_PROGRAMS,
    trainingCategories: LANDING_TRAINING_CATEGORIES,
    trainings: LANDING_TRAININGS,
    faqs: LANDING_FAQS,
    trainingFilter,
    setTrainingFilter,
    visibleTrainings,
  };
}

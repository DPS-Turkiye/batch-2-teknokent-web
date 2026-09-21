/** Mentee screens are orange, mentor screens blue; everything else is shared. */
export enum OnboardingTone {
  Mentee = "mentee",
  Mentor = "mentor",
}

export interface OnboardingToneClasses {
  text: string;
  bg: string;
  bgHover: string;
  border: string;
  soft: string;
  railNote: string;
  focus: string;
  stepDoneIcon: string;
  infoIcon: string;
  timelineDone: [string, string];
  timelineCurrent: string;
  currentText: string;
  avatar: string;
  nextSteps: string;
  nextStepsTitle: string;
}

export const ONBOARDING_TONES: Record<OnboardingTone, OnboardingToneClasses> = {
  [OnboardingTone.Mentee]: {
    text: "text-[#e86f22]",
    bg: "bg-[#e86f22]",
    bgHover: "hover:bg-[#ce5e19]",
    border: "border-[#e86f22]",
    soft: "bg-[#fff4ec]",
    railNote: "bg-[#f5faff]",
    focus: "focus:border-[#e86f22] focus:ring-2 focus:ring-[#fde4d3]",
    stepDoneIcon: "/onboarding/step-done-orange.svg",
    infoIcon: "/onboarding/info-done.svg",
    timelineDone: [
      "/onboarding/timeline-done-orange-1.svg",
      "/onboarding/timeline-done-orange-2.svg",
    ],
    timelineCurrent: "/onboarding/timeline-current-orange.svg",
    currentText: "text-[#9e4400]",
    avatar: "rounded-2xl bg-[#eef7f0] text-[#3f7d5a]",
    nextSteps: "bg-[rgba(255,242,236,0.35)]",
    nextStepsTitle: "text-[#9e4400]",
  },
  [OnboardingTone.Mentor]: {
    text: "text-[#0067b1]",
    bg: "bg-[#26a4ff]",
    bgHover: "hover:bg-[#1592ea]",
    border: "border-[#26a4ff]",
    soft: "bg-[#f2f8fc]",
    railNote: "bg-[#fff2ec]",
    focus: "focus:border-[#26a4ff] focus:ring-2 focus:ring-[#d6ecfc]",
    stepDoneIcon: "/onboarding/step-done-blue.svg",
    infoIcon: "/onboarding/info-done-blue.svg",
    timelineDone: [
      "/onboarding/timeline-done-blue-1.svg",
      "/onboarding/timeline-done-blue-2.svg",
    ],
    timelineCurrent: "/onboarding/timeline-current-blue.svg",
    currentText: "text-[#0067b1]",
    avatar: "rounded-full bg-[#e6f1f8] text-[#0067b1]",
    nextSteps: "border border-[#e6f1f8] bg-[#f2f8fc]",
    nextStepsTitle: "text-[#0067b1]",
  },
};

export const ONBOARDING_HELP_HREF =
  "mailto:info@metu.edu.tr?subject=menton%20Destek";

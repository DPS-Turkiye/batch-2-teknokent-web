import { MentorLabelColor } from "@/interfaces/mentor-label";

/** Mirrors the backend's MentorLabelLimits. */
export const MENTOR_LABEL_NAME_MAX_LENGTH = 30;
export const MENTOR_LABELS_PER_MENTOR = 5;

export const DEFAULT_MENTOR_LABEL_COLOR = MentorLabelColor.Blue;

/**
 * Chip classes per palette key. Every text color reaches at least 4.5:1 on its chip background (WCAG AA for
 * normal text); `test/lib/const/mentor-labels.test.ts` checks the pairs.
 */
export const MENTOR_LABEL_PALETTE: Record<
  MentorLabelColor,
  { background: string; text: string; chip: string; swatch: string }
> = {
  [MentorLabelColor.Blue]: {
    background: "#e7f1ff",
    text: "#0b4f99",
    chip: "border-[#bcd8fb] bg-[#e7f1ff] text-[#0b4f99]",
    swatch: "bg-[#0b4f99]",
  },
  [MentorLabelColor.Green]: {
    background: "#e5f5ea",
    text: "#1b6235",
    chip: "border-[#b7e0c4] bg-[#e5f5ea] text-[#1b6235]",
    swatch: "bg-[#1b6235]",
  },
  [MentorLabelColor.Purple]: {
    background: "#f0eaff",
    text: "#57379f",
    chip: "border-[#d6c9fb] bg-[#f0eaff] text-[#57379f]",
    swatch: "bg-[#57379f]",
  },
  [MentorLabelColor.Orange]: {
    background: "#ffefe1",
    text: "#954107",
    chip: "border-[#fbd0ad] bg-[#ffefe1] text-[#954107]",
    swatch: "bg-[#954107]",
  },
  [MentorLabelColor.Red]: {
    background: "#fde9e8",
    text: "#a1241d",
    chip: "border-[#f6c3c0] bg-[#fde9e8] text-[#a1241d]",
    swatch: "bg-[#a1241d]",
  },
  [MentorLabelColor.Yellow]: {
    background: "#fff6d4",
    text: "#6f5100",
    chip: "border-[#f2dd8f] bg-[#fff6d4] text-[#6f5100]",
    swatch: "bg-[#6f5100]",
  },
  [MentorLabelColor.Pink]: {
    background: "#fdeaf3",
    text: "#9b2259",
    chip: "border-[#f5c4da] bg-[#fdeaf3] text-[#9b2259]",
    swatch: "bg-[#9b2259]",
  },
  [MentorLabelColor.Teal]: {
    background: "#e2f5f3",
    text: "#10625d",
    chip: "border-[#b3e0db] bg-[#e2f5f3] text-[#10625d]",
    swatch: "bg-[#10625d]",
  },
  [MentorLabelColor.Indigo]: {
    background: "#e9ebfb",
    text: "#2e3a96",
    chip: "border-[#c7cdf3] bg-[#e9ebfb] text-[#2e3a96]",
    swatch: "bg-[#2e3a96]",
  },
  [MentorLabelColor.Gray]: {
    background: "#eef0f2",
    text: "#3d444d",
    chip: "border-[#d6dade] bg-[#eef0f2] text-[#3d444d]",
    swatch: "bg-[#3d444d]",
  },
};

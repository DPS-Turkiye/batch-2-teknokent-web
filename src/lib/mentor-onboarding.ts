import {
  type StudentProfile,
  type UpdateMentorAvailabilitySettingsPayload,
  type UpdateMentorProfilePayload,
  WEEKDAY_ORDER,
  Weekday,
} from "@/interfaces/mentor";
import type {
  MentorOnboardingDraft,
  StudentOnboardingDraft,
  WeeklyAvailability,
} from "@/interfaces/mentor-onboarding";

const SHORT_DAY: Record<Weekday, string> = {
  [Weekday.Monday]: "Pzt",
  [Weekday.Tuesday]: "Sal",
  [Weekday.Wednesday]: "Çar",
  [Weekday.Thursday]: "Per",
  [Weekday.Friday]: "Cum",
  [Weekday.Saturday]: "Cmt",
  [Weekday.Sunday]: "Paz",
};

function minutesOf(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function hourLabel(time: string) {
  const [hours, minutes] = time.split(":");
  return minutes === "00"
    ? String(Number(hours))
    : `${Number(hours)}.${minutes}`;
}

export function openDays(week: WeeklyAvailability) {
  return WEEKDAY_ORDER.filter((day) => week[day].enabled);
}

/** An open day whose end is not after its start can't be saved. */
export function invalidDays(week: WeeklyAvailability) {
  return openDays(week).filter(
    (day) => minutesOf(week[day].end) <= minutesOf(week[day].start),
  );
}

/** "Sal 14–17 · Çar 10–13 · Cum 15–18" */
export function weekSummary(week: WeeklyAvailability) {
  return openDays(week)
    .map(
      (day) =>
        `${SHORT_DAY[day]} ${hourLabel(week[day].start)}–${hourLabel(week[day].end)}`,
    )
    .join(" · ");
}

/** Open hours per week, and how many meetings of the chosen length fit in them. */
export function weeklyCapacity(draft: MentorOnboardingDraft) {
  const minutes = openDays(draft.week).reduce(
    (total, day) =>
      total +
      Math.max(
        0,
        minutesOf(draft.week[day].end) - minutesOf(draft.week[day].start),
      ),
    0,
  );
  const perDay = openDays(draft.week).reduce((total, day) => {
    const span =
      minutesOf(draft.week[day].end) - minutesOf(draft.week[day].start);
    const slot = draft.durationMinutes + draft.bufferMinutes;
    return total + Math.max(0, Math.floor((span + draft.bufferMinutes) / slot));
  }, 0);
  return { hours: Math.round((minutes / 60) * 10) / 10, meetings: perDay };
}

export function toStudentProfilePayload(
  student: StudentOnboardingDraft,
): StudentProfile {
  const list = (text: string, separator: RegExp) =>
    text
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);
  return {
    department: student.department.trim() || null,
    studyYear: student.studyYear || null,
    strongCourses: list(student.courses, /,/),
    projects: list(student.projects, /\n/),
    erasmus: student.erasmus.trim() || null,
  };
}

export function toStudentDraft(
  profile: StudentProfile,
): StudentOnboardingDraft {
  return {
    department: profile.department ?? "",
    studyYear: profile.studyYear ?? "",
    courses: profile.strongCourses.join(", "),
    projects: profile.projects.join("\n"),
    erasmus: profile.erasmus ?? "",
  };
}

/** A student mentor's studies go with the profile; anyone else's draft never sends them. */
export function toMentorProfilePayload(
  draft: MentorOnboardingDraft,
  studentMentor = false,
): UpdateMentorProfilePayload & { offerings: string[] } {
  return {
    ...(studentMentor
      ? { studentProfile: toStudentProfilePayload(draft.student) }
      : {}),
    professionalTitle: draft.profile.title.trim(),
    company: draft.profile.company.trim(),
    availabilityLabel: "",
    responseTimeLabel: draft.responseTime,
    meetingMode: draft.format,
    communicationPreference: "",
    mentoringStyle: "",
    fitLabel: "",
    experienceLevel: draft.profile.totalExperience.trim(),
    sectorExperience: "",
    startupStages: draft.stages.join(", "),
    specialties: draft.topics,
    menteeCapacity: draft.capacity,
    about: draft.about.trim(),
    meetingFrequency: draft.frequency,
    experiences: draft.profile.history
      .filter((role) => role.title.trim())
      .map((role) => ({
        title: role.title.trim(),
        organization: role.organization.trim(),
        period: role.period?.trim() ?? "",
        summary: role.summary?.trim() ?? "",
      })),
    offerings: draft.offerings,
  };
}

export function toAvailabilityPayload(
  draft: MentorOnboardingDraft,
): UpdateMentorAvailabilitySettingsPayload {
  return {
    rules: openDays(draft.week).map((day) => ({
      dayOfWeek: day,
      startTime: draft.week[day].start,
      endTime: draft.week[day].end,
      slotMinutes: draft.durationMinutes,
    })),
    exceptions: [],
    menteeCapacity: draft.capacity,
    defaultMeetingDurationMinutes: draft.durationMinutes,
    meetingBufferMinutes: draft.bufferMinutes,
  };
}

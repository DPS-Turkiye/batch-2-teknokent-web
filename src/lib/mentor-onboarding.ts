import {
  Weekday,
  WEEKDAY_ORDER,
  type StudentProfile,
  type UpdateMentorAvailabilitySettingsPayload,
  type UpdateMentorProfilePayload,
} from "@/interfaces/mentor";
import type {
  MentorOnboardingDraft,
  StudentOnboardingDraft,
  WeeklyAvailability,
} from "@/interfaces/mentor-onboarding";
import { minutesOfDay } from "@/lib/utils";

const SHORT_DAY: Record<Weekday, string> = {
  [Weekday.Monday]: "Pzt",
  [Weekday.Tuesday]: "Sal",
  [Weekday.Wednesday]: "Çar",
  [Weekday.Thursday]: "Per",
  [Weekday.Friday]: "Cum",
  [Weekday.Saturday]: "Cmt",
  [Weekday.Sunday]: "Paz",
};

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
    (day) => minutesOfDay(week[day].end) <= minutesOfDay(week[day].start),
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
        minutesOfDay(draft.week[day].end) - minutesOfDay(draft.week[day].start),
      ),
    0,
  );
  const perDay = openDays(draft.week).reduce((total, day) => {
    const span =
      minutesOfDay(draft.week[day].end) - minutesOfDay(draft.week[day].start);
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
    educations: draft.profile.education
      .filter((school) => school.school.trim())
      .map((school) => ({
        school: school.school.trim(),
        degree: school.degree.trim(),
        period: school.period.trim(),
      })),
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

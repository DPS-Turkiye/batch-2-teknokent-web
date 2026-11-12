"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useInstitutionRecord } from "@/hooks/use-institution-record";
import { STUDENT_APPOINTMENTS_QUERY_KEY } from "@/hooks/use-student-appointments";
import { STUDENT_HOME_QUERY_KEY } from "@/hooks/use-student-home";
import { AppointmentKind, type Appointment } from "@/interfaces/appointment";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursSlot,
} from "@/interfaces/student-office-hours";
import { ToastTone } from "@/interfaces/toast";
import { splitAppointments } from "@/lib/appointments";
import { isSameDay, startOfWeek } from "@/lib/calendar";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import {
  answerOfficeHoursAlternative,
  getOfficeHoursAcademician,
  getOfficeHoursAcademicians,
  getOfficeHoursSlots,
  requestOfficeHours,
} from "@/lib/client/student-office-hours";
import { startOfDay } from "@/lib/mobile-calendar";
import {
  academicianName,
  ADVISOR_ACADEMICIAN_ID,
  ADVISOR_SLOT_PREVIEW,
  advisorAcademician,
  filterAcademicians,
  firstBookableWeekDay,
  freeSlots,
  OFFICE_HOURS_DESCRIPTION_MAX,
  OFFICE_HOURS_LOOKAHEAD_DAYS,
  OFFICE_HOURS_TITLE_MAX,
  OFFICE_HOURS_WEEK_DAYS,
  officeHoursRequestErrors,
  officeHoursWeek,
  optionsOf,
  type OfficeHoursFilter,
  type OfficeHoursRequestErrors,
} from "@/lib/student-office-hours";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const OFFICE_HOURS_ACADEMICIANS_QUERY_KEY = [
  "student-office-hours",
  "academicians",
] as const;
const OFFICE_HOURS_SLOTS_QUERY_KEY = ["student-office-hours", "slots"] as const;
export const STUDENT_OFFICE_HOURS_HREF = "/student/office-hours";
const APPOINTMENTS_HREF = "/student/appointments";

export function officeHoursProfileHref(id: string) {
  return `${STUDENT_OFFICE_HOURS_HREF}/${encodeURIComponent(id)}`;
}

export function officeHoursBookingHref(id: string) {
  return `${officeHoursProfileHref(id)}/book`;
}

function startOfToday() {
  return startOfDay(new Date());
}

function slotsQuery(
  academician: OfficeHoursAcademician | null,
  from: Date,
  days: number,
) {
  const id = academician?.id ?? null;
  const duration = academician?.durationMinutes ?? null;
  return {
    queryKey: [
      ...OFFICE_HOURS_SLOTS_QUERY_KEY,
      id,
      duration,
      from.toISOString(),
      days,
    ],
    queryFn: (): Promise<StudentOfficeHoursSlot[]> =>
      id !== null && duration !== null
        ? getOfficeHoursSlots(id, from, days)
        : Promise.resolve([]),
    // The advisor from the institution record has no Office Hours listing of their own to ask.
    enabled: id !== null && id !== ADVISOR_ACADEMICIAN_ID,
  };
}

/** The advisor (from the institutional record) or a directory entry, by the route's id. */
function useAcademicianEntry(id: string) {
  const isAdvisor = id === ADVISOR_ACADEMICIAN_ID;
  const record = useInstitutionRecord(isAdvisor);
  const sample = useQuery({
    queryKey: [...OFFICE_HOURS_ACADEMICIANS_QUERY_KEY, id],
    queryFn: () => getOfficeHoursAcademician(id),
    enabled: !isAdvisor,
  });
  // On the "advisor" route, the advisor's own listing (times, booking, history) once they opted in.
  const listed = useQuery({
    queryKey: OFFICE_HOURS_ACADEMICIANS_QUERY_KEY,
    queryFn: getOfficeHoursAcademicians,
    enabled: isAdvisor,
  });
  const advisorAccount = record.data?.advisor?.userId ?? null;
  const listedAdvisor =
    isAdvisor && advisorAccount !== null
      ? listed.data?.find((item) => item.accountId === advisorAccount)
      : undefined;
  const source = isAdvisor ? record : sample;
  const academician = isAdvisor
    ? (listedAdvisor ?? (record.data ? advisorAcademician(record.data) : null))
    : (sample.data ?? null);
  return {
    academician,
    /** Whose appointments are "with them": the listing's id, as the requests name it. */
    counterpartId: listedAdvisor?.id ?? (isAdvisor ? advisorAccount : id),
    isLoading: source.isLoading,
    error: source.error,
    notFound: source.isSuccess && academician === null,
  };
}

/** Office Hours (Figma 80:400): the advisor on top, then every academician with their nearest free slot. */
export function useStudentOfficeHours() {
  const academicians = useQuery({
    queryKey: OFFICE_HOURS_ACADEMICIANS_QUERY_KEY,
    queryFn: getOfficeHoursAcademicians,
  });
  const record = useInstitutionRecord();
  // The advisor's own listing when they opted in, otherwise their name from the record, with no times to ask.
  const advisorAccount = record.data?.advisor?.userId ?? null;
  const listedAdvisor =
    advisorAccount === null
      ? undefined
      : academicians.data?.find((item) => item.accountId === advisorAccount);
  const advisor =
    listedAdvisor ?? (record.data ? advisorAcademician(record.data) : null);
  const [from] = useState(startOfToday);
  const [filter, setFilter] = useState<OfficeHoursFilter>({
    query: "",
    faculty: null,
    department: null,
    availableOnly: true,
  });
  const directory = (academicians.data ?? []).filter(
    (item) => item.id !== listedAdvisor?.id,
  );
  const everyone = [...(advisor ? [advisor] : []), ...directory];
  const slots = useQueries({
    queries: everyone.map((item) =>
      slotsQuery(item, from, OFFICE_HOURS_LOOKAHEAD_DAYS),
    ),
  });
  const free = new Map(
    everyone.map((item, index) => [
      item.id,
      freeSlots(slots[index]?.data ?? []),
    ]),
  );
  const freeOf = (id: string) => free.get(id) ?? [];

  return {
    isLoading: academicians.isLoading,
    // "Müsait saati olanlar" decides on the slots, so the list waits for them before it can say "none".
    // isLoading, not isPending: an advisor without a listing has no slots to load, and a disabled query stays pending.
    isLoadingSlots: slots.some((query) => query.isLoading),
    error: academicians.error,
    advisor: advisor
      ? {
          academician: advisor,
          slots: freeOf(advisor.id).slice(0, ADVISOR_SLOT_PREVIEW),
        }
      : null,
    cards: filterAcademicians(
      directory,
      filter,
      (id) => freeOf(id).length > 0,
    ).map((academician) => ({
      academician,
      nearest: freeOf(academician.id)[0] ?? null,
    })),
    total: directory.length,
    filter,
    faculties: optionsOf(directory, "faculty"),
    departments: optionsOf(
      directory.filter(
        (item) => filter.faculty === null || item.faculty === filter.faculty,
      ),
      "department",
    ),
    setQuery: (query: string) =>
      setFilter((current) => ({ ...current, query })),
    setFaculty: (faculty: string | null) =>
      setFilter((current) => ({ ...current, faculty, department: null })),
    setDepartment: (department: string | null) =>
      setFilter((current) => ({ ...current, department })),
    toggleAvailableOnly: () =>
      setFilter((current) => ({
        ...current,
        availableOnly: !current.availableOnly,
      })),
  };
}

/** Akademisyen Profili (Figma 116:126): who they are, this week's free slots and past sessions with them. */
export function useOfficeHoursProfile(id: string) {
  const entry = useAcademicianEntry(id);
  const [from] = useState(startOfToday);
  const lookahead = useQuery(
    slotsQuery(entry.academician, from, OFFICE_HOURS_LOOKAHEAD_DAYS),
  );
  const appointments = useQuery({
    queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
    queryFn: getStudentAppointments,
  });
  const free = freeSlots(lookahead.data ?? []);
  const weekEnd = startOfWeek(from);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const withThem = (appointments.data ?? []).filter(
    (item) =>
      item.kind === AppointmentKind.OfficeHours &&
      // A request sent from this screen names the route's id ("advisor"); one from the backend names the account.
      (item.counterpart.userId === id ||
        item.counterpart.userId === entry.counterpartId),
  );
  return {
    ...entry,
    nearest: free[0] ?? null,
    thisWeek: free.filter(
      (slot) => Date.parse(slot.startsAt) < weekEnd.getTime(),
    ),
    past: splitAppointments(withThem, new Date(appointments.dataUpdatedAt))
      .past,
  };
}

/** Saat seç + Randevu talep et (Figma 82:2, 82:194, 82:345). */
export function useOfficeHoursBooking(id: string) {
  const t = useTranslations("iaStudent.officeHours.request");
  const entry = useAcademicianEntry(id);
  const { academician } = entry;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [firstDay] = useState(() => firstBookableWeekDay(new Date()));
  const [anchor, setAnchor] = useState(firstDay);
  const [pickedDay, setPickedDay] = useState<Date | null>(null);
  const [selected, setSelected] = useState<StudentOfficeHoursSlot | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<OfficeHoursRequestErrors | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const weekStart = startOfWeek(anchor);
  const slots = useQuery(
    slotsQuery(academician, weekStart, OFFICE_HOURS_WEEK_DAYS),
  );
  const week = officeHoursWeek(slots.data ?? [], anchor);
  const day =
    week.find(
      (column) => pickedDay && isSameDay(column.day.toISOString(), pickedDay),
    ) ??
    week.find((column) => column.freeCount > 0) ??
    null;

  const send = useMutation({
    mutationFn: (input: {
      academician: OfficeHoursAcademician;
      slot: StudentOfficeHoursSlot;
    }) =>
      requestOfficeHours({
        academicianId: input.academician.id,
        slot: { startsAt: input.slot.startsAt, endsAt: input.slot.endsAt },
        title: title.trim(),
        description: description.trim(),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: STUDENT_HOME_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: OFFICE_HOURS_SLOTS_QUERY_KEY,
        }),
      ]),
  });

  const resetForm = () => {
    setFormOpen(false);
    setTitle("");
    setDescription("");
    setErrors(null);
    setFailure(null);
  };

  const moveWeek = (step: 1 | -1) => {
    setAnchor((current) => {
      const next = startOfWeek(current);
      next.setDate(next.getDate() + 7 * step);
      return next;
    });
    setPickedDay(null);
    setSelected(null);
  };

  const submit = async () => {
    if (!academician || !selected) return;
    const found = officeHoursRequestErrors(title, description);
    setErrors(found);
    setFailure(null);
    if (found) return;
    try {
      await send.mutateAsync({ academician, slot: selected });
      showToast({ message: t("sent"), tone: ToastTone.Success });
      const name = academicianName(academician);
      router.push(`${APPOINTMENTS_HREF}?sent=${encodeURIComponent(name)}`);
    } catch (error) {
      setFailure(errorMessage(error, t("failed")));
    }
  };

  return {
    ...entry,
    week,
    weekStart,
    weekEnd: week.at(-1)?.day ?? weekStart,
    isLoadingSlots: slots.isLoading,
    /** Weeks before the first bookable one have nothing left to ask for. */
    canGoBack: weekStart > startOfWeek(firstDay),
    previousWeek: () => {
      if (weekStart > startOfWeek(firstDay)) moveWeek(-1);
    },
    nextWeek: () => moveWeek(1),
    day,
    pickDay: (next: Date) => {
      setPickedDay(next);
      setSelected(null);
    },
    selected,
    select: setSelected,
    freeThisWeek: week.reduce((total, column) => total + column.freeCount, 0),
    formOpen,
    openForm: () => {
      if (selected) setFormOpen(true);
    },
    closeForm: resetForm,
    title,
    setTitle: (value: string) => {
      setTitle(value);
      setErrors((current) => current && { ...current, title: false });
    },
    description,
    setDescription: (value: string) => {
      setDescription(value);
      setErrors((current) => current && { ...current, description: false });
    },
    titleMax: OFFICE_HOURS_TITLE_MAX,
    descriptionMax: OFFICE_HOURS_DESCRIPTION_MAX,
    errors,
    failure,
    isSending: send.isPending,
    submit,
  };
}

/** "Önerilen Saati Kabul Et" / "Reddet" on an Office Hours request with another time proposed. */
export function useOfficeHoursAlternativeAnswer(appointment: Appointment) {
  const t = useTranslations("iaStudent.officeHours.answer");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const answer = useMutation({
    mutationFn: (accept: boolean) =>
      answerOfficeHoursAlternative(
        appointment.id,
        accept,
        appointment.alternative?.startsAt ?? null,
      ),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: STUDENT_HOME_QUERY_KEY }),
        // Withdrawing frees the time; taking another one books it.
        queryClient.invalidateQueries({
          queryKey: OFFICE_HOURS_SLOTS_QUERY_KEY,
        }),
      ]),
  });
  const respond = async (accept: boolean) => {
    try {
      await answer.mutateAsync(accept);
      showToast({
        message: t(accept ? "accepted" : "declined"),
        tone: ToastTone.Success,
      });
    } catch (error) {
      showToast({
        message: errorMessage(error, t("failed")),
        tone: ToastTone.Error,
      });
    }
  };
  return {
    accept: () => respond(true),
    decline: () => respond(false),
    isAnswering: answer.isPending,
  };
}

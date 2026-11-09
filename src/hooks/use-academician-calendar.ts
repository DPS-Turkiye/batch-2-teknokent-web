"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { useWeeklyAvailabilityForm } from "@/hooks/use-weekly-availability-form";
import type {
  AcademicianAvailability,
  OfficeHoursOneOff,
  UpdateAcademicianAvailabilityPayload,
} from "@/interfaces/academician-office-hours";
import type { UpdateMentorAvailabilitySettingsPayload } from "@/interfaces/mentor";
import {
  getAcademicianAvailability,
  saveAcademicianAvailability,
} from "@/lib/client/academician-office-hours";
import {
  ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  turkeyTimeRange,
} from "@/lib/academician-office-hours";

export const ACADEMICIAN_AVAILABILITY_QUERY_KEY = [
  ...ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  "availability",
] as const;

/** Office hours have a slot length; no student limit or buffer on the academician's screen. */
const NUMBER_FIELDS = ["defaultMeetingDurationMinutes"] as const;

const EMPTY_ONE_OFF = { date: "", start: "", end: "", place: "" };

function weeklyPayload(
  availability: AcademicianAvailability,
): UpdateMentorAvailabilitySettingsPayload {
  return {
    rules: availability.rules.map(
      ({ dayOfWeek, startTime, endTime, slotMinutes }) => ({
        dayOfWeek,
        startTime,
        endTime,
        slotMinutes,
      }),
    ),
    exceptions: availability.exceptions,
    menteeCapacity: availability.menteeCapacity,
    defaultMeetingDurationMinutes: availability.defaultMeetingDurationMinutes,
    meetingBufferMinutes: availability.meetingBufferMinutes,
  };
}

function oneOffPayload(oneOffs: OfficeHoursOneOff[]) {
  return oneOffs.map(({ startsAt, endsAt, place }) => ({
    startsAt,
    endsAt,
    place,
  }));
}

/** Takvim: weekly ranges and days off in the shared editor, plus one-off hours. */
export function useAcademicianCalendar() {
  const t = useTranslations("academicianWorkspace.calendar");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ACADEMICIAN_AVAILABILITY_QUERY_KEY,
    queryFn: getAcademicianAvailability,
  });
  const save = useMutation({
    mutationFn: (payload: UpdateAcademicianAvailabilityPayload) =>
      saveAcademicianAvailability(payload),
    onSuccess: (saved) =>
      queryClient.setQueryData(ACADEMICIAN_AVAILABILITY_QUERY_KEY, saved),
  });
  const saved = query.data;

  const weekly = useWeeklyAvailabilityForm(
    {
      settings: saved,
      loadFailed: Boolean(query.error),
      save: (payload) =>
        save.mutateAsync({
          ...payload,
          oneOffs: oneOffPayload(saved?.oneOffs ?? []),
        }),
      isSaving: save.isPending,
      numberFields: NUMBER_FIELDS,
    },
    () => undefined,
  );

  const [oneOff, setOneOff] = useState(EMPTY_ONE_OFF);
  const [oneOffError, setOneOffError] = useState<string | null>(null);

  const saveOneOffs = async (oneOffs: OfficeHoursOneOff[]) => {
    if (!saved) return false;
    try {
      await save.mutateAsync({
        ...weeklyPayload(saved),
        oneOffs: oneOffPayload(oneOffs),
      });
      showToast({ message: t("oneOffSaved"), tone: "success" });
      return true;
    } catch {
      showToast({ message: t("oneOffFailed"), tone: "error" });
      return false;
    }
  };

  const addOneOff = async (event: FormEvent) => {
    event.preventDefault();
    if (!saved) return;
    if (!oneOff.date || !oneOff.start || !oneOff.end) {
      setOneOffError(t("needDate"));
      return;
    }
    if (oneOff.end <= oneOff.start) {
      setOneOffError(t("endAfterStart"));
      return;
    }
    const [startHour, startMinute] = oneOff.start.split(":").map(Number);
    const [endHour, endMinute] = oneOff.end.split(":").map(Number);
    const range = turkeyTimeRange(
      `${oneOff.date}T${oneOff.start}`,
      endHour * 60 + endMinute - (startHour * 60 + startMinute),
    );
    if (Date.parse(range.startsAt) <= Date.now()) {
      setOneOffError(t("notPast"));
      return;
    }
    const added = [
      ...saved.oneOffs,
      { ...range, place: oneOff.place.trim() || null },
    ].toSorted((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    if (await saveOneOffs(added)) setOneOff(EMPTY_ONE_OFF);
  };

  return {
    weekly,
    oneOffs: saved?.oneOffs ?? [],
    oneOff,
    setOneOffField: (field: keyof typeof EMPTY_ONE_OFF, value: string) => {
      setOneOffError(null);
      setOneOff((current) => ({ ...current, [field]: value }));
    },
    oneOffError,
    addOneOff,
    removeOneOff: (index: number) =>
      void saveOneOffs((saved?.oneOffs ?? []).filter((_, at) => at !== index)),
    isSaving: save.isPending,
    isLoading: query.isLoading,
    error: query.error,
    retry: () => void query.refetch(),
  };
}

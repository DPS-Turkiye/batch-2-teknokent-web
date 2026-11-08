"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useToast } from "@/stores/toast-store";
import {
  type MentorAvailabilitySettings,
  type UpdateMentorAvailabilitySettingsPayload,
  type Weekday,
  WEEKDAY_ORDER,
} from "@/interfaces/mentor";
import {
  AVAILABILITY_NUMBER_FIELDS,
  type AvailabilityDraft,
  type AvailabilityNumberField,
  availabilityDraftError,
  DEFAULT_RANGE,
  EMPTY_EXCEPTION_INPUT,
  exceptionError,
  type ExceptionInput,
  nextRangeAfter,
  rangesForDay,
  stepNumberValue,
  toAvailabilityDraft,
  toAvailabilityPayload,
} from "@/lib/mentor-availability";
import { errorMessage } from "@/lib/utils";

const ALL_NUMBER_FIELDS = AVAILABILITY_NUMBER_FIELDS.map((item) => item.field);

/**
 * Where an owner's availability settings come from and how a save reaches them. An owner
 * without a capacity or buffer lists only the number fields it uses: the others are neither
 * shown nor checked, and their saved values go back unchanged.
 */
export type WeeklyAvailabilitySource = {
  settings: MentorAvailabilitySettings | undefined;
  loadFailed: boolean;
  save: (payload: UpdateMentorAvailabilitySettingsPayload) => Promise<unknown>;
  isSaving: boolean;
  numberFields?: readonly AvailabilityNumberField[];
};

/**
 * Edits one owner's weekly availability: time ranges per weekday, the number fields and
 * unavailable dates. The owner (a mentor today; a peer mentor or an academician later) only
 * supplies where the settings come from and how they are saved.
 */
export function useWeeklyAvailabilityForm(
  source: WeeklyAvailabilitySource,
  onSaved: () => void,
) {
  const t = useTranslations("availabilityEditor");
  const tOptions = useTranslations("options");
  const { showToast } = useToast();
  const { settings, numberFields = ALL_NUMBER_FIELDS } = source;
  const loaded = useMemo(
    () => (settings ? toAvailabilityDraft(settings) : null),
    [settings],
  );
  const [edits, setEdits] = useState<AvailabilityDraft | null>(null);
  const [exception, setException] = useState<ExceptionInput>(
    EMPTY_EXCEPTION_INPUT,
  );
  const [error, setError] = useState<string | null>(null);
  const [isAddingException, setIsAddingException] = useState(false);
  const nextKey = useRef(0);
  const draft = edits ?? loaded;

  const change = (
    update: (current: AvailabilityDraft) => AvailabilityDraft,
  ) => {
    setError(null);
    setEdits((current) => {
      const base = current ?? loaded;
      return base ? update(base) : current;
    });
  };
  // Keys are taken in the handler, not inside the state updater, so the updater stays pure.
  const newKey = () => `new-${(nextKey.current += 1)}`;

  const toggleDay = (day: Weekday) => {
    const key = newKey();
    change((current) =>
      current.ranges.some((range) => range.dayOfWeek === day)
        ? {
            ...current,
            ranges: current.ranges.filter((range) => range.dayOfWeek !== day),
          }
        : {
            ...current,
            ranges: [
              ...current.ranges,
              { key, dayOfWeek: day, ...DEFAULT_RANGE, slotMinutes: null },
            ],
          },
    );
  };

  const addRange = (day: Weekday) => {
    const key = newKey();
    change((current) => ({
      ...current,
      ranges: [
        ...current.ranges,
        {
          key,
          dayOfWeek: day,
          ...nextRangeAfter(rangesForDay(current, day)),
          slotMinutes: null,
        },
      ],
    }));
  };

  const removeRange = (key: string) =>
    change((current) => ({
      ...current,
      ranges: current.ranges.filter((range) => range.key !== key),
    }));

  const updateRange = (
    key: string,
    field: "startTime" | "endTime",
    value: string,
  ) =>
    change((current) => ({
      ...current,
      ranges: current.ranges.map((range) =>
        range.key === key ? { ...range, [field]: value } : range,
      ),
    }));

  const setNumber = (field: AvailabilityNumberField, value: string) =>
    change((current) => ({ ...current, [field]: value }));

  const stepNumber = (field: AvailabilityNumberField, direction: 1 | -1) => {
    const bounds = AVAILABILITY_NUMBER_FIELDS.find(
      (item) => item.field === field,
    );
    if (!bounds) return;
    change((current) => ({
      ...current,
      [field]: stepNumberValue(current[field], bounds, direction),
    }));
  };

  const openExceptionForm = () => setIsAddingException(true);

  const closeExceptionForm = () => {
    setIsAddingException(false);
    setException(EMPTY_EXCEPTION_INPUT);
    setError(null);
  };

  const setExceptionField = (field: keyof ExceptionInput, value: string) => {
    setError(null);
    setException((current) => ({ ...current, [field]: value }));
  };

  const addException = () => {
    if (!draft) return;
    const candidate = {
      startsOn: exception.startsOn,
      endsOn: exception.endsOn || exception.startsOn,
      reason: exception.reason.trim() || null,
    };
    const problem = exceptionError(candidate, draft.exceptions);
    if (problem) {
      setError(problem);
      return;
    }
    change((current) => ({
      ...current,
      exceptions: [...current.exceptions, candidate],
    }));
    setException(EMPTY_EXCEPTION_INPUT);
    setIsAddingException(false);
  };

  const removeException = (index: number) =>
    change((current) => ({
      ...current,
      exceptions: current.exceptions.filter(
        (_, position) => position !== index,
      ),
    }));

  const save = async () => {
    if (!draft) return;
    const problem = availabilityDraftError(draft, {
      capacityRequired: settings?.menteeCapacity != null,
      fields: numberFields,
    });
    if (problem) {
      setError(problem);
      return;
    }
    try {
      await source.save(toAvailabilityPayload(draft));
      setEdits(null);
      showToast({ message: t("saved"), tone: "success" });
      onSaved();
    } catch (saveError) {
      const message = errorMessage(saveError, t("saveFailed"));
      setError(message);
      showToast({ message, tone: "error" });
    }
  };

  return {
    addException,
    addRange,
    closeExceptionForm,
    days: draft
      ? WEEKDAY_ORDER.map((day) => ({
          day,
          label: tOptions(`weekday.${day}`),
          ranges: rangesForDay(draft, day),
        }))
      : [],
    draft,
    error,
    exception,
    isAddingException,
    isSaving: source.isSaving,
    loadError: source.loadFailed ? t("loadFailed") : null,
    numberFields,
    openExceptionForm,
    removeException,
    removeRange,
    save,
    setExceptionField,
    setNumber,
    stepNumber,
    toggleDay,
    updateRange,
  };
}

export type WeeklyAvailabilityForm = ReturnType<
  typeof useWeeklyAvailabilityForm
>;

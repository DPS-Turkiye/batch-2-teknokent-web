"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState, type SubmitEvent } from "react";

import type {
  AcademicianAvailability,
  UpdateAcademicianAvailabilityPayload,
} from "@/interfaces/academician-office-hours";
import { Weekday } from "@/interfaces/mentor";
import { ToastTone } from "@/interfaces/toast";
import {
  availabilitySummary,
  dayOffError,
  oneOffError,
  ruleError,
  withDayOff,
  withOneOff,
  withoutDayOff,
  withoutOneOff,
  withoutRule,
  withRule,
  type AvailabilityItem,
  type DayOffInput,
  type OneOffInput,
  type RuleInput,
} from "@/lib/academician-availability";
import {
  ACADEMICIAN_AVAILABILITY_QUERY_KEY,
  ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  TURKEY_TIME_ZONE,
  turkeyDay,
  turkeyWallClock,
} from "@/lib/academician-office-hours";
import {
  getAcademicianAvailability,
  saveAcademicianAvailability,
} from "@/lib/client/academician-office-hours";
import { formatDateRange } from "@/lib/format";
import { calendarDay } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

export type EditableRow = {
  id: string;
  kind: AvailabilityItemKind;
  title: string;
  hint: string;
};

type Fields = {
  rule: RuleInput;
  oneOff: OneOffInput;
  dayOff: DayOffInput;
};

const EMPTY_FIELDS: Fields = {
  rule: { dayOfWeek: Weekday.Monday, startTime: "", endTime: "" },
  oneOff: { date: "", startTime: "", endTime: "", place: "" },
  dayOff: { startsOn: "", endsOn: "", reason: "" },
};

type DialogState = {
  kind: AvailabilityItemKind;
  /** The item being edited; null while adding. */
  editing: string | null;
  /** Opened from the page's "Müsaitlik Ekle", so the kind is still a choice. */
  chooseKind: boolean;
  fields: Fields;
  error: string | null;
};

function idOf(item: AvailabilityItem) {
  switch (item.kind) {
    case AvailabilityItemKind.Recurring:
      return item.rule.id;
    case AvailabilityItemKind.OneOff:
      return item.oneOff.id ?? item.oneOff.startsAt;
    case AvailabilityItemKind.Unavailable:
      return item.exception.id ?? item.exception.startsOn;
  }
}

/** "HH:mm" of a moment on Turkey's clock, for a time input. */
function clockOf(value: string) {
  const date = turkeyWallClock(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The form filled in with an item, for editing it. */
function fieldsFor(item: AvailabilityItem): Fields {
  switch (item.kind) {
    case AvailabilityItemKind.Recurring:
      return {
        ...EMPTY_FIELDS,
        rule: {
          dayOfWeek: item.rule.dayOfWeek,
          startTime: item.rule.startTime,
          endTime: item.rule.endTime,
        },
      };
    case AvailabilityItemKind.OneOff:
      return {
        ...EMPTY_FIELDS,
        oneOff: {
          date: turkeyDay(item.oneOff.startsAt),
          startTime: clockOf(item.oneOff.startsAt),
          endTime: clockOf(item.oneOff.endsAt),
          place: item.oneOff.place ?? "",
        },
      };
    case AvailabilityItemKind.Unavailable:
      return {
        ...EMPTY_FIELDS,
        dayOff: {
          startsOn: item.exception.startsOn,
          endsOn: item.exception.endsOn,
          reason: item.exception.reason ?? "",
        },
      };
  }
}

/** "Müsaitliği düzenle": the three lists, adding and editing through one dialog, removing from a row's menu. */
export function useAcademicianAvailabilityEditor() {
  const t = useTranslations("iaAcademician.availability");
  const tWeekday = useTranslations("options.weekday");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ACADEMICIAN_AVAILABILITY_QUERY_KEY,
    queryFn: getAcademicianAvailability,
  });
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const save = useMutation({
    mutationFn: ({
      payload,
    }: {
      payload: UpdateAcademicianAvailabilityPayload;
      done: string;
    }) => saveAcademicianAvailability(payload),
    onSuccess: (saved, { done }) => {
      queryClient.setQueryData(ACADEMICIAN_AVAILABILITY_QUERY_KEY, saved);
      showToast({ message: done, tone: ToastTone.Success });
      setDialog(null);
    },
    onError: () => {
      showToast({ message: t("failed"), tone: ToastTone.Error });
    },
    // The calendar, the rail and Ana Sayfa all read the hours.
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
      }),
  });

  const shared = {
    isLoading: query.isLoading,
    error: query.error,
    retry: () => void query.refetch(),
    isRetrying: query.isRefetching,
  };
  const availability = query.data;
  if (!availability) return { ...shared, editor: null };

  const now = new Date(query.dataUpdatedAt);
  const items = availabilitySummary(availability, now);
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  });
  const longDayOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  // Moments are shown in Turkey time; day strings ("YYYY-MM-DD") are already days and stay as they are.
  const longMoment = new Intl.DateTimeFormat(locale, {
    ...longDayOptions,
    timeZone: TURKEY_TIME_ZONE,
  });
  const longDay = new Intl.DateTimeFormat(locale, longDayOptions);

  const toRow = (item: AvailabilityItem): EditableRow => {
    switch (item.kind) {
      case AvailabilityItemKind.Recurring:
        return {
          id: idOf(item),
          kind: item.kind,
          title: t("recurringRow", {
            weekday: tWeekday(item.rule.dayOfWeek),
            hours: `${item.rule.startTime} – ${item.rule.endTime}`,
          }),
          hint: t("cards.recurring.rowHint"),
        };
      case AvailabilityItemKind.OneOff:
        return {
          id: idOf(item),
          kind: item.kind,
          title: t("dateRow", {
            date: longMoment.format(new Date(item.oneOff.startsAt)),
            hours: formatDateRange(
              clock,
              new Date(item.oneOff.startsAt),
              new Date(item.oneOff.endsAt),
            ),
          }),
          hint:
            item.oneOff.place === null
              ? t("cards.oneOff.rowHint")
              : t("cards.oneOff.rowHintPlace", { place: item.oneOff.place }),
        };
      case AvailabilityItemKind.Unavailable:
        return {
          id: idOf(item),
          kind: item.kind,
          title: t("dateRow", {
            date: formatDateRange(
              longDay,
              calendarDay(item.exception.startsOn),
              calendarDay(item.exception.endsOn),
            ),
            hours: t("allDay"),
          }),
          hint:
            item.exception.reason === null
              ? t("cards.unavailable.rowHint")
              : t("cards.unavailable.rowHintReason", {
                  reason: item.exception.reason,
                }),
        };
    }
  };

  const rowsOf = (kind: AvailabilityItemKind) =>
    items.filter((item) => item.kind === kind).map(toRow);

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!dialog) return;
    const result = payloadFor(availability, dialog, now);
    if (typeof result === "string") {
      setDialog({ ...dialog, error: t(`errors.${result}`) });
      return;
    }
    save.mutate({ payload: result, done: t("saved") });
  };

  const remove = (kind: AvailabilityItemKind, id: string) => {
    save.mutate({
      payload: removal(availability, kind, id),
      done: t("removed"),
    });
  };

  return {
    ...shared,
    editor: {
      recurring: rowsOf(AvailabilityItemKind.Recurring),
      oneOff: rowsOf(AvailabilityItemKind.OneOff),
      unavailable: rowsOf(AvailabilityItemKind.Unavailable),
      dialog,
      openAdd: (kind: AvailabilityItemKind | null) => {
        setDialog({
          kind: kind ?? AvailabilityItemKind.Recurring,
          editing: null,
          chooseKind: kind === null,
          fields: EMPTY_FIELDS,
          error: null,
        });
      },
      openEdit: (kind: AvailabilityItemKind, id: string) => {
        const item = items.find(
          (candidate) => candidate.kind === kind && idOf(candidate) === id,
        );
        if (!item) return;
        setDialog({
          kind,
          editing: id,
          chooseKind: false,
          fields: fieldsFor(item),
          error: null,
        });
      },
      setKind: (kind: AvailabilityItemKind) => {
        if (dialog) setDialog({ ...dialog, kind, error: null });
      },
      setRule: (change: Partial<RuleInput>) => {
        if (!dialog) return;
        setDialog({
          ...dialog,
          error: null,
          fields: {
            ...dialog.fields,
            rule: { ...dialog.fields.rule, ...change },
          },
        });
      },
      setOneOff: (change: Partial<OneOffInput>) => {
        if (!dialog) return;
        setDialog({
          ...dialog,
          error: null,
          fields: {
            ...dialog.fields,
            oneOff: { ...dialog.fields.oneOff, ...change },
          },
        });
      },
      setDayOff: (change: Partial<DayOffInput>) => {
        if (!dialog) return;
        setDialog({
          ...dialog,
          error: null,
          fields: {
            ...dialog.fields,
            dayOff: { ...dialog.fields.dayOff, ...change },
          },
        });
      },
      closeDialog: () => {
        setDialog(null);
      },
      submit,
      remove,
      isSaving: save.isPending,
    },
  };
}

/** The save for the dialog, or the reason it can't be saved. */
function payloadFor(
  availability: AcademicianAvailability,
  dialog: DialogState,
  now: Date,
) {
  const { fields, editing } = dialog;
  switch (dialog.kind) {
    case AvailabilityItemKind.Recurring:
      return (
        ruleError(fields.rule, availability.rules, editing) ??
        withRule(availability, fields.rule, editing)
      );
    case AvailabilityItemKind.OneOff:
      return (
        oneOffError(fields.oneOff, availability, editing, now) ??
        withOneOff(availability, fields.oneOff, editing)
      );
    case AvailabilityItemKind.Unavailable:
      return (
        dayOffError(fields.dayOff, availability.exceptions, editing) ??
        withDayOff(availability, fields.dayOff, editing)
      );
  }
}

function removal(
  availability: AcademicianAvailability,
  kind: AvailabilityItemKind,
  id: string,
) {
  switch (kind) {
    case AvailabilityItemKind.Recurring:
      return withoutRule(availability, id);
    case AvailabilityItemKind.OneOff:
      return withoutOneOff(availability, id);
    case AvailabilityItemKind.Unavailable:
      return withoutDayOff(availability, id);
  }
}

export type AcademicianAvailabilityEditor = NonNullable<
  ReturnType<typeof useAcademicianAvailabilityEditor>["editor"]
>;

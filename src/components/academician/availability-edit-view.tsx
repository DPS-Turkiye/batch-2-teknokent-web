"use client";

import { CalendarDays, CircleX, Plus, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { AppointmentsCalendarCard } from "@/components/academician/appointments-calendar";
import { Drawers } from "@/components/academician/appointments-view";
import { AvailabilityItemDialog } from "@/components/academician/availability-item-dialog";
import { AvailabilityRowMenu } from "@/components/academician/availability-row-menu";
import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { PageHeader } from "@/components/ia/page-header";
import { StatusTone } from "@/components/ia/status-badge";
import { useAcademicianAppointmentsCalendar } from "@/hooks/use-academician-appointments-calendar";
import {
  useAcademicianAvailabilityEditor,
  type AcademicianAvailabilityEditor,
  type EditableRow,
} from "@/hooks/use-academician-availability-editor";
import { ACADEMICIAN_ROUTES } from "@/lib/academician-routes";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

const KIND_ICON: Record<AvailabilityItemKind, ReactNode> = {
  [AvailabilityItemKind.Recurring]: (
    <Repeat aria-hidden className="size-4 text-brand-odtu-strong" />
  ),
  [AvailabilityItemKind.OneOff]: (
    <CalendarDays aria-hidden className="size-4 text-brand-odtu-strong" />
  ),
  [AvailabilityItemKind.Unavailable]: (
    <CircleX aria-hidden className="size-4 text-brand-odtu-strong" />
  ),
};

const ROW_STYLE: Record<AvailabilityItemKind, string> = {
  [AvailabilityItemKind.Recurring]: "border-border-default",
  [AvailabilityItemKind.OneOff]: "border-border-default",
  [AvailabilityItemKind.Unavailable]:
    "border-brand-odtu-strong bg-brand-odtu-bg",
};

/** "Randevularım › Müsaitliği düzenle": the same calendar, with the three lists that make the hours. */
export function AcademicianAvailabilityEditView() {
  const t = useTranslations("iaAcademician.availability");
  const { calendar, ...calendarState } = useAcademicianAppointmentsCalendar(
    ACADEMICIAN_ROUTES.availability,
  );
  const { editor, ...editorState } = useAcademicianAvailabilityEditor();
  const ready = calendar !== null && editor !== null;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        back={{ href: ACADEMICIAN_ROUTES.appointments, label: t("back") }}
        actions={
          <Button
            variant={ButtonVariant.Secondary}
            disabled={editor === null}
            onClick={() => editor?.openAdd(null)}
          >
            {t("add")}
          </Button>
        }
      >
        <p className="type-body text-text-secondary">{t("subtitle")}</p>
      </PageHeader>
      <SampleDataNotice />
      {ready ? (
        <>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <AppointmentsCalendarCard calendar={calendar} />
            <EditorLists editor={editor} />
          </div>
          <Drawers calendar={calendar} />
          <AvailabilityItemDialog editor={editor} />
        </>
      ) : (
        <WorkspaceQueryState
          isLoading={calendarState.isLoading || editorState.isLoading}
          error={calendarState.error ?? editorState.error}
          onRetry={() => {
            calendarState.retry();
            editorState.retry();
          }}
          isRetrying={calendarState.isRetrying || editorState.isRetrying}
        />
      )}
    </div>
  );
}

function EditorLists({ editor }: { editor: AcademicianAvailabilityEditor }) {
  const t = useTranslations("iaAcademician.availability");
  return (
    <div className="space-y-5">
      {/* The product tour's "Haftalık saatlerini ekle" step points here. */}
      <div data-tour="availability-weekly">
        <ListCard
          editor={editor}
          kind={AvailabilityItemKind.Recurring}
          rows={editor.recurring}
        />
      </div>
      <ListCard
        editor={editor}
        kind={AvailabilityItemKind.OneOff}
        rows={editor.oneOff}
      />
      <ListCard
        editor={editor}
        kind={AvailabilityItemKind.Unavailable}
        rows={editor.unavailable}
      />
      <InlineAlert tone={StatusTone.Neutral} title={t("howTitle")}>
        {t("howBody")}
      </InlineAlert>
    </div>
  );
}

function ListCard({
  editor,
  kind,
  rows,
}: {
  editor: AcademicianAvailabilityEditor;
  kind: AvailabilityItemKind;
  rows: EditableRow[];
}) {
  const t = useTranslations("iaAcademician.availability");
  const titleId = useId();
  const title = t(`cards.${kind}.title`);
  return (
    <Card labelledBy={titleId} compact className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="type-h4 text-text-primary">
            {title}
          </h2>
          <p className="type-caption text-text-muted">
            {t(`cards.${kind}.hint`)}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("addToLabel", { list: title })}
          onClick={() => {
            editor.openAdd(kind);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 type-label text-text-primary hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
        >
          <Plus aria-hidden className="size-4" />
          {t("addTo")}
        </button>
      </div>
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${ROW_STYLE[row.kind]}`}
            >
              {KIND_ICON[row.kind]}
              <span className="min-w-0 flex-1">
                <span className="block type-label text-text-primary">
                  {row.title}
                </span>
                <span className="block type-caption text-text-muted">
                  {row.hint}
                </span>
              </span>
              <AvailabilityRowMenu
                itemLabel={row.title}
                disabled={editor.isSaving}
                onEdit={() => {
                  editor.openEdit(row.kind, row.id);
                }}
                onRemove={() => {
                  editor.remove(row.kind, row.id);
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body-sm text-text-secondary">
          {t(`cards.${kind}.empty`)}
        </p>
      )}
    </Card>
  );
}

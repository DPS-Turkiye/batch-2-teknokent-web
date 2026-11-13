"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { PageHeader } from "@/components/ia/page-header";
import { StatusTone } from "@/components/ia/status-badge";
import {
  AppointmentMonthGrid,
  AppointmentTimeGrid,
  kindSwatch,
} from "@/components/student/ia/appointment-calendar";
import { AppointmentListCard } from "@/components/student/ia/appointment-list-card";
import { OfficeHoursAlternativeActions } from "@/components/student/ia/office-hours-alternative-actions";
import {
  AppointmentStatusBadge,
  InitialsAvatar,
} from "@/components/student/ia/ui";
import {
  useStudentAppointments,
  type StudentAppointmentsModel,
  type StudentAppointmentsOptions,
} from "@/hooks/use-student-appointments";
import {
  AppointmentKind,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import { timeLabel } from "@/lib/calendar";
import { calendarTitle } from "@/lib/student-appointments";
import { canAnswerAlternative } from "@/lib/student-office-hours";
import { formatDayMonth } from "@/lib/utils";
import {
  AppointmentsTab,
  AppointmentsView,
} from "@/types/student-appointments";

const FIND_MENTOR_HREF = "/student/peer-mentoring";
const SIDE_PREVIEW = 3;
const VIEWS = Object.values(AppointmentsView);
const TABS = Object.values(AppointmentsTab);
const LEGEND_STATUSES = [
  AppointmentStatus.Pending,
  AppointmentStatus.AlternativeProposed,
  AppointmentStatus.Confirmed,
] as const;

/** The ARIA tabs keys: arrows move to the neighbouring tab (wrapping), Home and End to the ends. */
function tabAfterKey(current: AppointmentsTab, key: string) {
  const index = TABS.indexOf(current);
  switch (key) {
    case "ArrowRight":
      return TABS[(index + 1) % TABS.length];
    case "ArrowLeft":
      return TABS[(index - 1 + TABS.length) % TABS.length];
    case "Home":
      return TABS[0];
    case "End":
      return TABS.at(-1);
    default:
      return undefined;
  }
}

type RenderActions = ((appointment: Appointment) => ReactNode) | undefined;

/** The card's buttons: Office Hours' own answer to a proposed time, then whatever an edition adds. */
function actionsFor(appointment: Appointment, renderActions: RenderActions) {
  const own = canAnswerAlternative(appointment) ? (
    <OfficeHoursAlternativeActions appointment={appointment} />
  ) : null;
  const extra = renderActions?.(appointment) ?? null;
  return own || extra ? (
    <>
      {own}
      {extra}
    </>
  ) : null;
}

/**
 * Randevularım (Figma 82:496 list, 99:2 / 99:228 / 99:390 calendars). Extension points for other student
 * editions: `filter` narrows every view, `toolbar` renders under the header (İŞKUR's role filter), and
 * `renderActions` adds a kind's answer buttons to a card (Office Hours' accept / decline).
 */
export function StudentAppointmentsView({
  sentTo = null,
  filter,
  toolbar,
  renderActions,
}: {
  /** Who a request was just sent to: shows the "Randevu talebin gönderildi" banner and opens Talepler. */
  sentTo?: string | null;
  filter?: StudentAppointmentsOptions["filter"];
  toolbar?: ReactNode;
  renderActions?: RenderActions;
}) {
  const t = useTranslations("iaStudent.appointments");
  const appointments = useStudentAppointments({
    filter,
    initialTab: sentTo ? AppointmentsTab.Requests : AppointmentsTab.Upcoming,
  });

  return (
    <div className="flex flex-col gap-8">
      {sentTo ? (
        <div data-tour="appointment-request-sent">
          <InlineAlert tone={StatusTone.Success} title={t("sent.title")}>
            {t("sent.body", { name: sentTo })}
          </InlineAlert>
        </div>
      ) : null}
      <PageHeader
        title={t("title")}
        actions={
          <div
            role="group"
            aria-label={t("viewLabel")}
            className="flex rounded-2xl bg-background-muted p-1"
          >
            {VIEWS.map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={appointments.view === view}
                onClick={() => appointments.setView(view)}
                className={`h-9 rounded-xl px-4 type-label ${
                  appointments.view === view
                    ? "bg-background-surface text-text-accent shadow-raised"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t(`views.${view}`)}
              </button>
            ))}
          </div>
        }
      >
        <p className="type-body text-text-secondary">{t("subtitle")}</p>
      </PageHeader>
      {toolbar}
      <AppointmentsBody
        appointments={appointments}
        renderActions={renderActions}
      />
    </div>
  );
}

function AppointmentsBody({
  appointments,
  renderActions,
}: {
  appointments: StudentAppointmentsModel;
  renderActions: RenderActions;
}) {
  const t = useTranslations("iaStudent.appointments");
  if (appointments.isLoading) {
    return (
      <p role="status" className="type-body-sm text-text-muted">
        {t("loading")}
      </p>
    );
  }
  if (appointments.error) {
    return (
      <InlineAlert tone={StatusTone.Error} title={t("error")}>
        <Button
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Small}
          disabled={appointments.isRetrying}
          onClick={appointments.retry}
          className="mt-2"
        >
          {t("retry")}
        </Button>
      </InlineAlert>
    );
  }
  if (appointments.isEmpty) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <h2 className="type-title-card text-text-primary">{t("empty")}</h2>
        <p className="type-body-sm text-text-secondary">{t("emptyBody")}</p>
        <Button href={FIND_MENTOR_HREF}>{t("findMentor")}</Button>
      </Card>
    );
  }
  return appointments.view === AppointmentsView.List ? (
    <ListView appointments={appointments} renderActions={renderActions} />
  ) : (
    <CalendarView appointments={appointments} renderActions={renderActions} />
  );
}

function ListView({
  appointments,
  renderActions,
}: {
  appointments: StudentAppointmentsModel;
  renderActions: RenderActions;
}) {
  const t = useTranslations("iaStudent.appointments");
  const items = appointments.tabs[appointments.tab];
  const upcoming = appointments.tabs[AppointmentsTab.Upcoming];
  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={t("tabLabel")}
        className="grid grid-cols-3 border-b border-border-subtle"
        onKeyDown={(event) => {
          const next = tabAfterKey(appointments.tab, event.key);
          if (!next) return;
          event.preventDefault();
          appointments.setTab(next);
          event.currentTarget
            .querySelector<HTMLElement>(`#appointments-tab-${next}`)
            ?.focus();
        }}
      >
        {TABS.map((tab) => {
          const active = appointments.tab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`appointments-tab-${tab}`}
              aria-selected={active}
              aria-controls="appointments-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => appointments.setTab(tab)}
              className={`-mb-px flex items-center justify-center gap-2 border-b-2 py-3 type-label ${
                active
                  ? "border-action-accent text-text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t(`tabs.${tab}`)}
              {tab === AppointmentsTab.Past ? null : (
                <span
                  className={`grid min-w-5 place-items-center rounded-full px-1.5 type-caption ${
                    active
                      ? "bg-background-selected text-text-accent"
                      : "bg-background-muted text-text-secondary"
                  }`}
                >
                  {appointments.tabs[tab].length}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div
          role="tabpanel"
          id="appointments-panel"
          aria-labelledby={`appointments-tab-${appointments.tab}`}
        >
          {items.length === 0 ? (
            <p className="rounded-card border border-dashed border-border-default p-6 type-body-sm text-text-muted">
              {t(`tabEmpty.${appointments.tab}`)}
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item, index) => (
                <li key={item.id}>
                  <AppointmentListCard
                    appointment={item}
                    actions={actionsFor(item, renderActions)}
                    tourAnchor={
                      appointments.tab === AppointmentsTab.Upcoming &&
                      index === 0
                        ? "appointments-first-row"
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="flex flex-col gap-6">
          <Card labelledBy="appointments-legend">
            <h2 id="appointments-legend" className="type-h4 text-text-primary">
              {t("legend.title")}
            </h2>
            <dl className="mt-4 flex flex-col gap-4">
              {LEGEND_STATUSES.map((status) => (
                <div key={status} className="flex flex-col gap-1.5">
                  <dt>
                    <AppointmentStatusBadge status={status} />
                  </dt>
                  <dd className="type-body-sm text-text-secondary">
                    {t(`legend.${status}`)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
          {upcoming.length > 0 &&
          appointments.tab !== AppointmentsTab.Upcoming ? (
            <Card labelledBy="appointments-side-upcoming">
              <div className="flex items-baseline justify-between gap-3">
                <h2
                  id="appointments-side-upcoming"
                  className="type-h4 text-text-primary"
                >
                  {t("tabs.upcoming")}
                </h2>
                <button
                  type="button"
                  onClick={() => appointments.setTab(AppointmentsTab.Upcoming)}
                  className="type-label text-text-link hover:underline"
                >
                  {t("seeAll")} <span aria-hidden>→</span>
                </button>
              </div>
              <ul className="mt-4 flex flex-col gap-4">
                {upcoming.slice(0, SIDE_PREVIEW).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <SideLine appointment={item} />
                    <AppointmentStatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SideLine({ appointment }: { appointment: Appointment }) {
  const tKind = useTranslations("iaStudent.common.kind");
  const locale = useLocale();
  return (
    <div className="min-w-0">
      <p className="type-label text-text-primary">
        {[appointment.counterpart.title, appointment.counterpart.fullName]
          .filter(Boolean)
          .join(" ")}
      </p>
      <p className="type-caption text-text-muted">
        {`${formatDayMonth(new Date(appointment.startsAt), locale)} · ${timeLabel(appointment.startsAt, locale)} · ${tKind(appointment.kind)}`}
      </p>
    </div>
  );
}

function CalendarView({
  appointments,
  renderActions,
}: {
  appointments: StudentAppointmentsModel;
  renderActions: RenderActions;
}) {
  const t = useTranslations("iaStudent.appointments.calendar");
  const locale = useLocale();
  const isMonth = appointments.view === AppointmentsView.Month;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <Card labelledBy="appointments-calendar-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="appointments-calendar-title"
            className="type-h4 text-text-primary"
          >
            {calendarTitle(appointments.view, appointments.anchor, locale)}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Small}
              onClick={appointments.goToday}
            >
              {t("today")}
            </Button>
            <button
              type="button"
              aria-label={t("previous")}
              onClick={appointments.previous}
              className="grid size-9 place-items-center rounded-xl text-icon-default hover:bg-background-subtle"
            >
              <ChevronLeft aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label={t("next")}
              onClick={appointments.next}
              className="grid size-9 place-items-center rounded-xl text-icon-default hover:bg-background-subtle"
            >
              <ChevronRight aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        {isMonth ? (
          <AppointmentMonthGrid
            cells={appointments.month}
            today={appointments.today}
            selectedDay={appointments.selectedDay}
            onSelectDay={appointments.selectDay}
          />
        ) : (
          <AppointmentTimeGrid
            days={appointments.days}
            today={appointments.today}
            selectedId={appointments.selected?.id ?? null}
            onSelect={appointments.select}
          />
        )}
      </Card>
      <aside className="flex flex-col gap-6">
        {isMonth ? (
          <DayList appointments={appointments} />
        ) : appointments.selected ? (
          <AppointmentDetail
            appointment={appointments.selected}
            actions={actionsFor(appointments.selected, renderActions)}
          />
        ) : (
          <Card>
            <p className="type-body-sm text-text-muted">{t("nothingInView")}</p>
          </Card>
        )}
        <ColorLegend />
      </aside>
    </div>
  );
}

function AppointmentDetail({
  appointment,
  actions,
}: {
  appointment: Appointment;
  actions: ReactNode;
}) {
  const t = useTranslations("iaStudent.appointments.calendar");
  const tList = useTranslations("iaStudent.appointments");
  const tKind = useTranslations("iaStudent.common.kind");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const proposed =
    appointment.status === AppointmentStatus.AlternativeProposed
      ? appointment.alternative
      : null;
  const shown = proposed ?? appointment;
  const name = [appointment.counterpart.title, appointment.counterpart.fullName]
    .filter(Boolean)
    .join(" ");
  return (
    <Card labelledBy="appointment-detail-title">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-7 items-center rounded-full bg-background-muted px-2.5 type-label-sm text-text-primary">
          {tKind(appointment.kind)}
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <h2
        id="appointment-detail-title"
        className="mt-4 type-h4 break-words text-text-primary"
      >
        {appointment.category
          ? tTopic(appointment.category)
          : appointment.topic}
      </h2>
      <p className="mt-3 flex items-center gap-2 type-label text-text-primary">
        <InitialsAvatar name={appointment.counterpart.fullName} size="sm" />
        {name}
      </p>
      <div
        className={`mt-4 rounded-2xl px-4 py-3 ${
          proposed
            ? "bg-status-info-bg text-status-info-text"
            : "bg-background-subtle text-text-primary"
        }`}
      >
        <p className="type-caption">
          {proposed ? t("proposedTime") : t("time")}
        </p>
        <p className="type-label-lg">
          {`${formatDayMonth(new Date(shown.startsAt), locale)} · ${timeLabel(shown.startsAt, locale)} – ${timeLabel(shown.endsAt, locale)}`}
        </p>
      </div>
      {appointment.counterpartMessage ? (
        <p className="mt-3 type-body-sm break-words text-text-secondary">
          {tList("counterpartMessage", {
            message: appointment.counterpartMessage,
          })}
        </p>
      ) : null}
      {actions ? (
        <div className="mt-4 flex flex-wrap gap-3">{actions}</div>
      ) : null}
    </Card>
  );
}

function DayList({ appointments }: { appointments: StudentAppointmentsModel }) {
  const t = useTranslations("iaStudent.appointments.calendar");
  const tKind = useTranslations("iaStudent.common.kind");
  const locale = useLocale();
  return (
    <Card labelledBy="appointments-day-title">
      <h2 id="appointments-day-title" className="type-h4 text-text-primary">
        {formatDayMonth(appointments.selectedDay, locale)}
      </h2>
      {appointments.selectedDayItems.length === 0 ? (
        <p className="mt-3 type-body-sm text-text-muted">{t("emptyDay")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {appointments.selectedDayItems.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border-l-4 px-4 py-3 ${
                item.kind === AppointmentKind.OfficeHours
                  ? "border-status-info-icon bg-status-info-bg"
                  : "border-action-primary-bg bg-background-selected"
              }`}
            >
              <div className="min-w-0">
                <p className="type-label break-words text-text-primary">
                  {`${timeLabel(item.startsAt, locale)} · ${item.topic}`}
                </p>
                <p className="type-caption text-text-secondary">
                  {`${item.counterpart.fullName} · ${tKind(item.kind)}`}
                </p>
              </div>
              <AppointmentStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ColorLegend() {
  const t = useTranslations("iaStudent.appointments.colors");
  return (
    <Card labelledBy="appointments-colors">
      <h2 id="appointments-colors" className="type-h4 text-text-primary">
        {t("title")}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {Object.values(AppointmentKind).map((kind) => (
          <LegendRow
            key={kind}
            swatch={kindSwatch(kind, false)}
            title={t(`${kind}.title`)}
            body={t(`${kind}.body`)}
          />
        ))}
        <LegendRow
          swatch="border border-dashed border-border-strong"
          title={t("dashed.title")}
          body={t("dashed.body")}
        />
      </ul>
    </Card>
  );
}

function LegendRow({
  swatch,
  title,
  body,
}: {
  swatch: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className={`mt-1 size-4 shrink-0 rounded ${swatch}`} />
      <span className="flex flex-col">
        <span className="type-label text-text-primary">{title}</span>
        <span className="type-caption text-text-muted">{body}</span>
      </span>
    </li>
  );
}

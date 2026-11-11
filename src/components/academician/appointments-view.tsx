"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale, useTranslations } from "next-intl";

import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import {
  DetailBox,
  fieldClass,
  labelClass,
  PersonLine,
  WorkspaceList,
  WorkspaceRow,
} from "@/components/academician/workspace-ui";
import {
  FilterPills,
  OutlineButton,
  PageHeading,
  SolidButton,
} from "@/components/admin/admin-ui";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import { EmptyState } from "@/components/common/empty-state";
import {
  AppointmentsView,
  useAcademicianAppointments,
  type AcademicianAppointmentsState,
} from "@/hooks/use-academician-appointments";
import {
  OfficeHoursAppointmentAction,
  type AcademicianAppointment,
} from "@/interfaces/academician-office-hours";
import { formatTimeRange, httpUrlOrNull } from "@/lib/utils";

export function AcademicianAppointmentsView() {
  const t = useTranslations("academicianWorkspace.appointments");
  const state = useAcademicianAppointments();
  const loaded = !state.isLoading && !state.error;
  const views = [
    AppointmentsView.Upcoming,
    AppointmentsView.Past,
    AppointmentsView.Cancelled,
  ];
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <SampleDataNotice />
      <WorkspaceQueryState
        isLoading={state.isLoading}
        error={state.error}
        onRetry={state.retry}
        isRetrying={state.isRetrying}
      />
      {loaded && state.isEmpty ? (
        <EmptyState accent="blue" title={t("empty")} />
      ) : null}
      {loaded && !state.isEmpty ? (
        <>
          <FilterPills
            value={state.view}
            onChange={state.setView}
            options={views.map((id) => ({
              id,
              label: `${t(id)} (${state.counts[id]})`,
            }))}
          />
          {state.shown.length ? (
            <WorkspaceList label={t(state.view)}>
              {state.shown.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  state={state}
                />
              ))}
            </WorkspaceList>
          ) : (
            <EmptyState accent="blue" title={t(`emptyView.${state.view}`)} />
          )}
        </>
      ) : null}
    </div>
  );
}

function AppointmentRow({
  appointment,
  state,
}: {
  appointment: AcademicianAppointment;
  state: AcademicianAppointmentsState;
}) {
  const t = useTranslations("academicianWorkspace.appointments");
  const locale = useLocale();
  const link = httpUrlOrNull(appointment.onlineUrl);
  const canCancel =
    state.view === AppointmentsView.Upcoming &&
    appointment.allowedActions.includes(OfficeHoursAppointmentAction.Cancel);
  const cancelling = state.cancelling === appointment.id;
  const late = state.isLate(appointment);
  return (
    <WorkspaceRow>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="min-w-0 flex-1">
          <PersonLine
            name={appointment.counterpart.fullName}
            detail={appointment.topic}
          />
        </div>
        <div className="shrink-0 text-[13px] text-[#22262b] lg:w-[250px]">
          <time dateTime={appointment.startsAt}>
            {formatTimeRange(appointment.startsAt, appointment.endsAt, locale)}
          </time>
          <p className="mt-0.5 truncate text-[12.5px] text-[#858c96]">
            {[
              appointment.place
                ? t("place", { place: appointment.place })
                : null,
              appointment.courseName
                ? t("course", { course: appointment.courseName })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-[12.5px] font-medium text-[#1583d6]"
            >
              {t("online")}
            </a>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-[210px] lg:justify-end">
          <AppointmentStatusChip status={appointment.status} />
          {canCancel && !cancelling ? (
            <OutlineButton onClick={() => state.startCancel(appointment.id)}>
              {t("cancel")}
            </OutlineButton>
          ) : null}
        </div>
      </div>
      {appointment.lateCancel || appointment.rejectReason ? (
        <p className="mt-2 text-[12.5px] text-[#676e78]">
          {[
            appointment.lateCancel ? t("lateCancel") : null,
            appointment.rejectReason
              ? t("reason", { reason: appointment.rejectReason })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
      {cancelling ? (
        <form
          noValidate
          aria-label={t("cancel")}
          onSubmit={state.submitCancel(appointment)}
          className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <DetailBox label={t("cancelReason")}>
            <textarea
              aria-label={t("cancelReason")}
              value={state.reason}
              onChange={(event) => state.setReason(event.target.value)}
              rows={2}
              className={fieldClass}
            />
            {late ? (
              <p className={`mt-1.5 ${labelClass}`}>{t("cancelReasonHint")}</p>
            ) : null}
            {state.formError ? (
              <p role="alert" className="mt-1.5 text-[12px] text-[#d9464b]">
                {state.formError}
              </p>
            ) : null}
          </DetailBox>
          <div className="flex gap-2">
            <SolidButton type="submit" disabled={state.isCancelling}>
              {t("confirmCancel")}
            </SolidButton>
            <OutlineButton onClick={state.stopCancel}>
              {t("keep")}
            </OutlineButton>
          </div>
        </form>
      ) : null}
    </WorkspaceRow>
  );
}

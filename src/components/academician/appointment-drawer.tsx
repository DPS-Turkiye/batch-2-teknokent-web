"use client";

import { CalendarDays, Clock, MapPin, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { AppointmentStatusBadge } from "@/components/academician/appointment-status-badge";
import { DrawerShell } from "@/components/academician/request-drawer";
import { StudentAvatar } from "@/components/academician/student-avatar";
import { Button, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import { useAppointmentDrawer } from "@/hooks/use-appointment-drawer";
import type { AcademicianAppointment } from "@/interfaces/academician-office-hours";

export function AppointmentDrawer({
  appointment,
  now,
  onClose,
}: {
  appointment: AcademicianAppointment;
  now: Date;
  onClose: () => void;
}) {
  const t = useTranslations("iaAcademician.appointmentDrawer");
  const drawer = useAppointmentDrawer(appointment, { now, onClose });
  const reasonId = useId();

  return (
    <DrawerShell
      title={t("title")}
      onClose={onClose}
      footer={
        drawer.canCancel && !drawer.cancelling ? (
          <Button variant={ButtonVariant.Ghost} onClick={drawer.startCancel}>
            {t("cancel")}
          </Button>
        ) : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-5">
        <div className="flex items-center gap-3">
          <StudentAvatar name={appointment.counterpart.fullName} />
          <div>
            <p className="type-label-lg text-text-primary">
              {appointment.counterpart.fullName}
            </p>
            {appointment.counterpart.department === null ? null : (
              <p className="type-caption text-text-muted">
                {appointment.counterpart.department}
              </p>
            )}
          </div>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <h2 className="type-h3 text-text-primary">{appointment.topic}</h2>
      <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-background-subtle p-4">
        <div className="flex gap-2">
          <CalendarDays
            aria-hidden
            className="mt-0.5 size-4 text-icon-default"
          />
          <div>
            <dt className="type-caption text-text-muted">{t("date")}</dt>
            <dd className="type-label text-text-primary">{drawer.date}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <Clock aria-hidden className="mt-0.5 size-4 text-icon-default" />
          <div>
            <dt className="type-caption text-text-muted">{t("time")}</dt>
            <dd className="type-label text-text-primary">{drawer.hours}</dd>
          </div>
        </div>
      </dl>
      <dl className="space-y-2">
        {appointment.place === null ? null : (
          <div className="flex items-center gap-2 type-body-sm">
            <MapPin aria-hidden className="size-4 text-icon-default" />
            <dt className="text-text-muted">{t("place")}</dt>
            <dd className="text-text-primary">{appointment.place}</dd>
          </div>
        )}
        {appointment.onlineUrl === null ? null : (
          <div className="flex items-center gap-2 type-body-sm">
            <Video aria-hidden className="size-4 text-icon-default" />
            <dt className="text-text-muted">{t("online")}</dt>
            <dd>
              <a
                href={appointment.onlineUrl}
                target="_blank"
                rel="noreferrer"
                className="text-text-link underline"
              >
                {appointment.onlineUrl}
              </a>
            </dd>
          </div>
        )}
        {appointment.courseName === null ? null : (
          <div className="flex items-center gap-2 type-body-sm">
            <dt className="text-text-muted">{t("course")}</dt>
            <dd className="text-text-primary">{appointment.courseName}</dd>
          </div>
        )}
      </dl>
      {drawer.canCancel || drawer.cancelling ? null : (
        <p className="type-caption text-text-muted">{t("cannotCancel")}</p>
      )}
      {drawer.cancelling ? (
        <form onSubmit={drawer.submit} className="space-y-3">
          <label htmlFor={reasonId} className="type-label text-text-primary">
            {drawer.needsReason ? t("reason") : t("reasonOptional")}
          </label>
          <textarea
            id={reasonId}
            value={drawer.reason}
            onChange={(event) => {
              drawer.setReason(event.target.value);
            }}
            rows={4}
            aria-invalid={drawer.error !== null}
            className="w-full rounded-input border border-border-control px-4 py-3 type-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-border-selected"
          />
          {drawer.needsReason ? (
            <InlineAlert tone={StatusTone.Warning}>
              {t("reasonRequired")}
            </InlineAlert>
          ) : null}
          {drawer.error === null ? null : (
            <p role="alert" className="type-caption text-status-error-text">
              {drawer.error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant={ButtonVariant.Ghost} onClick={drawer.stopCancel}>
              {t("back")}
            </Button>
            <Button
              variant={ButtonVariant.Destructive}
              type="submit"
              disabled={drawer.isCancelling}
              className="flex-1"
            >
              {t("confirmCancel")}
            </Button>
          </div>
        </form>
      ) : null}
    </DrawerShell>
  );
}

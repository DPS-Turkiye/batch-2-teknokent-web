"use client";

import { CalendarClock, CalendarDays, Clock, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { AdviseeChip } from "@/components/academician/advisee-chip";
import { AppointmentStatusBadge } from "@/components/academician/appointment-status-badge";
import { StudentAvatar } from "@/components/academician/student-avatar";
import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import {
  useRequestDrawer,
  type RequestDrawerState,
} from "@/hooks/use-request-drawer";
import type { OfficeHoursRequest } from "@/interfaces/academician-office-hours";
import type { CalendarSource } from "@/lib/academician-calendar";
import { RequestFit } from "@/types/academician-calendar";

export const DRAWER_OVERLAY =
  "fixed inset-0 z-[60] flex justify-end bg-background-inverse/20";
export const DRAWER_PANEL =
  "flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-background-surface shadow-modal outline-none";

const FIT_TONE: Record<RequestFit, StatusTone> = {
  [RequestFit.Fits]: StatusTone.Success,
  [RequestFit.Outside]: StatusTone.Warning,
  [RequestFit.Clash]: StatusTone.Error,
  [RequestFit.DayOff]: StatusTone.Error,
  [RequestFit.Past]: StatusTone.Neutral,
};

/** The side panel the drawers share: a heading, a close button, the body and a footer. */
export function DrawerShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTranslations("iaAcademician.common");
  const titleId = useId();
  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={onClose}
      overlayClassName={DRAWER_OVERLAY}
      panelClassName={DRAWER_PANEL}
      dismissOnBackdrop
    >
      <div className="flex items-center justify-between gap-3 px-6 pt-6">
        <p id={titleId} className="type-label text-text-secondary">
          {title}
        </p>
        <button
          type="button"
          aria-label={t("close")}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="flex-1 space-y-5 px-6 py-5">{children}</div>
      {footer ? (
        <div className="flex gap-2 border-t border-border-subtle px-6 py-4">
          {footer}
        </div>
      ) : null}
    </ModalDialog>
  );
}

/** A drawer opened from a link whose request or appointment is gone (answered, cancelled, or never existed). */
export function GoneDrawer({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <DrawerShell title={title} onClose={onClose}>
      <InlineAlert tone={StatusTone.Neutral}>{message}</InlineAlert>
    </DrawerShell>
  );
}

export function RequestDrawer({
  request,
  isAdvisee,
  source,
  now,
  onPropose,
  onClose,
}: {
  request: OfficeHoursRequest;
  isAdvisee: boolean;
  source: Pick<CalendarSource, "availability" | "appointments">;
  now: Date;
  onPropose: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("iaAcademician.requestDrawer");
  const drawer = useRequestDrawer(request, { source, now, onClose });
  const pickId = useId();
  const reasonId = useId();
  const [single] = drawer.times;
  // A request that waits for the student (or a source that allows no answer) has nothing to do here.
  const answerable = drawer.canAccept || drawer.canDecline || drawer.canPropose;

  return (
    <DrawerShell
      title={t("title")}
      onClose={onClose}
      footer={
        answerable ? (
          <RequestDrawerFooter drawer={drawer} onPropose={onPropose} />
        ) : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-5">
        <div className="flex items-center gap-3">
          <StudentAvatar name={request.student.fullName} />
          <div>
            <p className="flex flex-wrap items-center gap-2 type-label-lg text-text-primary">
              {request.student.fullName}
              {isAdvisee ? <AdviseeChip /> : null}
            </p>
            <p className="type-caption text-text-muted">
              {[request.student.department, drawer.classYear]
                .filter((part) => part !== null)
                .join(" · ")}
            </p>
          </div>
        </div>
        <AppointmentStatusBadge status={request.status} />
      </div>

      <h2 className="type-h3 text-text-primary">{request.topic}</h2>

      {drawer.times.length > 1 ? (
        <fieldset className="space-y-2">
          <legend id={pickId} className="mb-2 type-label text-text-primary">
            {t("pickTime")}
          </legend>
          {drawer.times.map((time) => (
            <label
              key={time.key}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${
                time.checked
                  ? "border-border-selected bg-background-subtle"
                  : "border-border-default"
              }`}
            >
              <input
                type="radio"
                name={pickId}
                checked={time.checked}
                onChange={() => {
                  drawer.pick(time.key);
                }}
                className="accent-brand-odtu-strong"
              />
              <span className="type-body-sm text-text-primary">
                {`${time.date} · ${time.hours}`}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {drawer.times.length === 1 && single ? (
        <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-background-subtle p-4">
          <div className="flex gap-2">
            <CalendarDays
              aria-hidden
              className="mt-0.5 size-4 text-icon-default"
            />
            <div>
              <dt className="type-caption text-text-muted">{t("date")}</dt>
              <dd className="type-label text-text-primary">{single.date}</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <Clock aria-hidden className="mt-0.5 size-4 text-icon-default" />
            <div>
              <dt className="type-caption text-text-muted">{t("time")}</dt>
              <dd className="type-label text-text-primary">{single.hours}</dd>
            </div>
          </div>
        </dl>
      ) : null}

      {request.note === null ? null : (
        <div className="space-y-1">
          <p className="type-caption text-text-muted">{t("note")}</p>
          <p className="type-body-sm text-text-primary">{request.note}</p>
        </div>
      )}
      {request.courseName === null ? null : (
        <p className="type-body-sm text-text-secondary">
          {`${t("course")}: ${request.courseName}`}
        </p>
      )}
      {request.messages.length > 0 ? (
        <div className="space-y-2">
          <p className="type-caption text-text-muted">{t("messages")}</p>
          <ul className="space-y-1.5 rounded-2xl bg-background-subtle p-3">
            {request.messages.map((message) => (
              <li
                key={message.sentAt}
                className="type-body-sm text-text-primary"
              >
                {message.body}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {drawer.fit ? (
        <InlineAlert tone={FIT_TONE[drawer.fit.kind]}>
          {drawer.fit.text}
        </InlineAlert>
      ) : null}

      {drawer.declining ? (
        <div className="space-y-2">
          <label htmlFor={reasonId} className="type-label text-text-primary">
            {t("declineReason")}
          </label>
          <textarea
            id={reasonId}
            value={drawer.reason}
            onChange={(event) => {
              drawer.setReason(event.target.value);
            }}
            rows={4}
            className="w-full rounded-input border border-border-control px-4 py-3 type-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-border-selected"
          />
        </div>
      ) : null}
    </DrawerShell>
  );
}

function RequestDrawerFooter({
  drawer,
  onPropose,
}: {
  drawer: RequestDrawerState;
  onPropose: () => void;
}) {
  const t = useTranslations("iaAcademician.requestDrawer");
  if (drawer.declining) {
    return (
      <>
        <Button variant={ButtonVariant.Ghost} onClick={drawer.stopDecline}>
          {t("back")}
        </Button>
        <Button
          variant={ButtonVariant.Destructive}
          disabled={drawer.isBusy}
          onClick={drawer.decline}
          className="flex-1"
        >
          {t("confirmDecline")}
        </Button>
      </>
    );
  }
  return (
    <>
      {drawer.canDecline ? (
        <Button variant={ButtonVariant.Ghost} onClick={drawer.startDecline}>
          {t("decline")}
        </Button>
      ) : null}
      {drawer.canPropose ? (
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onPropose}
          className="flex-1"
        >
          <CalendarClock aria-hidden className="size-4" />
          {t("propose")}
        </Button>
      ) : null}
      {drawer.canAccept ? (
        <span data-tour="request-drawer-accept">
          <Button
            disabled={!drawer.hasPick || drawer.isBusy}
            onClick={drawer.accept}
          >
            {t("accept")}
          </Button>
        </span>
      ) : null}
    </>
  );
}

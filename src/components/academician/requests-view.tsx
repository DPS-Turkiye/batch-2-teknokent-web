"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useLocale, useTranslations } from "next-intl";

import {
  OutlineButton,
  PageHeading,
  SolidButton,
} from "@/components/admin/admin-ui";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import {
  DetailBox,
  EmptyLine,
  PersonLine,
  WorkspaceList,
  WorkspaceRow,
  WorkspaceSection,
  fieldClass,
  labelClass,
} from "@/components/academician/workspace-ui";
import { EmptyState } from "@/components/common/empty-state";
import {
  type AcademicianRequestsState,
  useAcademicianRequests,
} from "@/hooks/use-academician-requests";
import {
  MAX_PROPOSED_TIMES,
  OfficeHoursRequestAction,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

const ACTION_LABEL = {
  [OfficeHoursRequestAction.Accept]: "accept",
  [OfficeHoursRequestAction.Decline]: "decline",
  [OfficeHoursRequestAction.ProposeTimes]: "propose",
  [OfficeHoursRequestAction.AskQuestion]: "ask",
} as const;

export function AcademicianRequestsView() {
  const t = useTranslations("academicianWorkspace.requests");
  const requests = useAcademicianRequests();
  const loaded = !requests.isLoading && !requests.error;
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <SampleDataNotice />
      <WorkspaceQueryState
        isLoading={requests.isLoading}
        error={requests.error}
        onRetry={requests.retry}
        isRetrying={requests.isRetrying}
      />
      {loaded && requests.isEmpty ? (
        <EmptyState accent="blue" title={t("emptyAll")} />
      ) : null}
      {loaded && !requests.isEmpty ? (
        <>
          <RequestSection
            title={t("waitingForYou")}
            empty={t("emptyForYou")}
            items={requests.waitingForYou}
            state={requests}
          />
          {requests.waitingForStudent.length ? (
            <RequestSection
              title={t("waitingForStudent")}
              items={requests.waitingForStudent}
              state={requests}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function RequestSection({
  title,
  empty,
  items,
  state,
}: {
  title: string;
  empty?: string;
  items: OfficeHoursRequest[];
  state: AcademicianRequestsState;
}) {
  return (
    <WorkspaceSection title={title}>
      {items.length ? (
        <WorkspaceList label={title}>
          {items.map((request) => (
            <RequestCard key={request.id} request={request} state={state} />
          ))}
        </WorkspaceList>
      ) : (
        <EmptyLine text={empty ?? ""} />
      )}
    </WorkspaceSection>
  );
}

function RequestCard({
  request,
  state,
}: {
  request: OfficeHoursRequest;
  state: AcademicianRequestsState;
}) {
  const t = useTranslations("academicianWorkspace.requests");
  const locale = useLocale();
  const formOpen = state.form?.id === request.id ? state.form.action : null;
  const range = (time: { startsAt: string; endsAt: string }) =>
    formatTimeRange(time.startsAt, time.endsAt, locale);
  return (
    <WorkspaceRow>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PersonLine
          name={request.student.fullName}
          detail={[request.student.department, request.courseName]
            .filter(Boolean)
            .join(" · ")}
          tone="orange"
        />
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#858c96]">
            {t("requestedAt", {
              date: formatDateTime(request.requestedAt, locale),
            })}
          </span>
          <AppointmentStatusChip status={request.status} />
        </div>
      </div>
      <h3 className="mt-3 break-words text-[14.5px] font-semibold text-[#22262b]">
        {request.topic}
      </h3>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <DetailBox
          label={
            request.requestedTimes.length > 1
              ? t("requestedTimesMany")
              : t("requestedTimes")
          }
        >
          <ul className="space-y-0.5">
            {request.requestedTimes.map((time) => (
              <li key={time.startsAt}>{range(time)}</li>
            ))}
          </ul>
        </DetailBox>
        {request.proposedTimes.length ? (
          <DetailBox label={t("proposedTimes")}>
            <ul className="space-y-0.5">
              {request.proposedTimes.map((time) => (
                <li key={time.startsAt}>{range(time)}</li>
              ))}
            </ul>
          </DetailBox>
        ) : null}
        {request.note ? (
          <DetailBox label={t("noteLabel")}>{request.note}</DetailBox>
        ) : null}
      </div>
      {request.messages.length ? (
        <ul className="mt-3 space-y-1 rounded-[18px] bg-[#f5f6f8] px-4 py-3 text-[13px] text-[#22262b]">
          {request.messages.map((message) => (
            <li key={`${message.sentAt}-${message.author}`}>{message.body}</li>
          ))}
        </ul>
      ) : null}
      {request.awaitingStudentReply ? (
        <p className="mt-2 text-[12.5px] text-[#676e78]">
          {t("questionAsked")}
        </p>
      ) : null}
      {formOpen ? (
        <AnswerForm request={request} action={formOpen} state={state} />
      ) : request.allowedActions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {request.allowedActions.map((action) =>
            action === OfficeHoursRequestAction.Accept ? (
              <SolidButton
                key={action}
                onClick={() => state.open(request, action)}
              >
                {t(ACTION_LABEL[action])}
              </SolidButton>
            ) : (
              <OutlineButton
                key={action}
                onClick={() => state.open(request, action)}
              >
                {t(ACTION_LABEL[action])}
              </OutlineButton>
            ),
          )}
        </div>
      ) : null}
    </WorkspaceRow>
  );
}

function AnswerForm({
  request,
  action,
  state,
}: {
  request: OfficeHoursRequest;
  action: OfficeHoursRequestAction;
  state: AcademicianRequestsState;
}) {
  const t = useTranslations("academicianWorkspace.requests");
  const locale = useLocale();
  return (
    <form
      noValidate
      onSubmit={state.submit(request)}
      aria-label={t(ACTION_LABEL[action])}
      className="mt-4 space-y-3 rounded-[18px] border border-[#e4e7ea] px-4 py-4"
    >
      {action === OfficeHoursRequestAction.Accept ? (
        <fieldset className="space-y-1.5 text-[13px]">
          <legend className={labelClass}>{t("pickTime")}</legend>
          {request.requestedTimes.map((time) => (
            <label key={time.startsAt} className="flex items-center gap-2">
              <input
                type="radio"
                name={`time-${request.id}`}
                value={time.startsAt}
                checked={state.pickedTime === time.startsAt}
                onChange={() => state.setPickedTime(time.startsAt)}
              />
              {formatTimeRange(time.startsAt, time.endsAt, locale)}
            </label>
          ))}
        </fieldset>
      ) : null}
      {action === OfficeHoursRequestAction.Decline ? (
        <label className={`block ${labelClass}`}>
          {t("reason")}
          <textarea
            value={state.reason}
            onChange={(event) => state.setReason(event.target.value)}
            className={fieldClass}
            rows={2}
          />
        </label>
      ) : null}
      {action === OfficeHoursRequestAction.ProposeTimes ? (
        <div className="space-y-2">
          <p className="text-[12.5px] text-[#858c96]">
            {t("proposeHint", { max: MAX_PROPOSED_TIMES })}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {state.proposedTimes.map((value, index) => (
              <label key={index} className={`block ${labelClass}`}>
                {t("proposedTime", { number: index + 1 })}
                <input
                  type="datetime-local"
                  step={900}
                  value={value}
                  onChange={(event) =>
                    state.setProposedTime(index, event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
            ))}
          </div>
          {state.canAddProposedTime ? (
            <button
              type="button"
              onClick={state.addProposedTime}
              className="text-[12.5px] font-medium text-[#1583d6]"
            >
              {t("addTime")}
            </button>
          ) : null}
        </div>
      ) : null}
      {action === OfficeHoursRequestAction.AskQuestion ? (
        <label className={`block ${labelClass}`}>
          {t("question")}
          <textarea
            value={state.question}
            onChange={(event) => state.setQuestion(event.target.value)}
            className={fieldClass}
            rows={2}
          />
        </label>
      ) : null}
      {state.formError ? (
        <p role="alert" className="text-[12px] text-[#d9464b]">
          {state.formError}
        </p>
      ) : null}
      <div className="flex gap-2">
        <SolidButton type="submit" disabled={state.isAnswering}>
          {action === OfficeHoursRequestAction.Accept ? t("accept") : t("send")}
        </SolidButton>
        <OutlineButton onClick={state.close}>{t("cancel")}</OutlineButton>
      </div>
    </form>
  );
}

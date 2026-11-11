"use client";

import { useTranslations } from "next-intl";

import { AppointmentDrawer } from "@/components/academician/appointment-drawer";
import { AppointmentsCalendarCard } from "@/components/academician/appointments-calendar";
import { AppointmentsFilterChips } from "@/components/academician/appointments-filter-chips";
import { AppointmentsRail } from "@/components/academician/appointments-rail";
import { ProposeTimesDialog } from "@/components/academician/propose-times-dialog";
import {
  GoneDrawer,
  RequestDrawer,
} from "@/components/academician/request-drawer";
import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { StudentProfileDialog } from "@/components/academician/student-profile-dialog";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { Button, ButtonVariant } from "@/components/ia/button";
import { PageHeader } from "@/components/ia/page-header";
import {
  useAcademicianAppointmentsCalendar,
  type AcademicianAppointmentsCalendar,
} from "@/hooks/use-academician-appointments-calendar";
import { RequestStep } from "@/types/academician-calendar";

export function AcademicianAppointmentsView() {
  const t = useTranslations("iaAcademician.appointments");
  const { calendar, isLoading, error, retry, isRetrying } =
    useAcademicianAppointmentsCalendar();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button
            variant={ButtonVariant.Secondary}
            href={calendar?.links.availability}
          >
            {t("editAvailability")}
          </Button>
        }
      >
        <p className="type-body text-text-secondary">{t("subtitle")}</p>
      </PageHeader>
      <SampleDataNotice />
      {calendar ? (
        <AppointmentsContent calendar={calendar} />
      ) : (
        <WorkspaceQueryState
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          isRetrying={isRetrying}
        />
      )}
    </div>
  );
}

function AppointmentsContent({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  return (
    <>
      <AppointmentsFilterChips
        value={calendar.filter}
        onChange={calendar.setFilter}
        requestCount={calendar.requestCount}
      />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AppointmentsCalendarCard calendar={calendar} />
        <AppointmentsRail calendar={calendar} />
      </div>
      <Drawers calendar={calendar} />
    </>
  );
}

export function Drawers({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  const tRequest = useTranslations("iaAcademician.requestDrawer");
  const tAppointment = useTranslations("iaAcademician.appointmentDrawer");
  if (calendar.selectedRequest) {
    const request = calendar.selectedRequest;
    if (calendar.step === RequestStep.Propose) {
      return (
        <ProposeTimesDialog
          key={request.id}
          request={request}
          source={calendar.source}
          now={calendar.now}
          onDone={calendar.closeDrawer}
          onCancel={calendar.backToRequest}
        />
      );
    }
    if (calendar.step === RequestStep.Profile) {
      return (
        <StudentProfileDialog
          key={request.id}
          userId={request.student.userId}
          onClose={calendar.backToRequest}
        />
      );
    }
    return (
      <RequestDrawer
        key={request.id}
        request={request}
        isAdvisee={calendar.isAdvisee(request.student.userId)}
        source={calendar.source}
        now={calendar.now}
        onPropose={calendar.openPropose}
        onOpenProfile={calendar.openProfile}
        onClose={calendar.closeDrawer}
      />
    );
  }
  if (calendar.requestMissing) {
    return (
      <GoneDrawer
        title={tRequest("title")}
        message={tRequest("gone")}
        onClose={calendar.closeDrawer}
      />
    );
  }
  if (calendar.selectedAppointment) {
    return (
      <AppointmentDrawer
        key={calendar.selectedAppointment.id}
        appointment={calendar.selectedAppointment}
        now={calendar.now}
        onClose={calendar.closeDrawer}
      />
    );
  }
  if (calendar.appointmentMissing) {
    return (
      <GoneDrawer
        title={tAppointment("title")}
        message={tAppointment("gone")}
        onClose={calendar.closeDrawer}
      />
    );
  }
  return null;
}

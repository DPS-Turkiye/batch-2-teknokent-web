import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppointmentRoleLabel } from "@/components/appointments/appointment-role-label";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
} from "@/interfaces/appointment";
import { InLocale } from "@test/test-utils";

describe("AppointmentStatusChip", () => {
  it.each([
    [AppointmentStatus.Pending, "Onay Bekliyor"],
    [AppointmentStatus.Confirmed, "Onaylandı"],
    [AppointmentStatus.Rejected, "Reddedildi"],
    [AppointmentStatus.AlternativeProposed, "Alternatif Önerildi"],
    [AppointmentStatus.Cancelled, "İptal Edildi"],
    [AppointmentStatus.Expired, "Süresi Doldu"],
    [AppointmentStatus.Withdrawn, "Geri Çekildi"],
  ])("labels %s as %s", (status, label) => {
    render(<AppointmentStatusChip status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("has English labels", () => {
    render(
      <InLocale locale="en">
        <AppointmentStatusChip status={AppointmentStatus.Pending} />
      </InLocale>,
    );
    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
  });
});

describe("AppointmentRoleLabel", () => {
  it("says which side of a peer-mentoring appointment the viewer is on", () => {
    render(
      <>
        <AppointmentRoleLabel
          kind={AppointmentKind.PeerMentoring}
          side={AppointmentSide.Mentor}
        />
        <AppointmentRoleLabel
          kind={AppointmentKind.PeerMentoring}
          side={AppointmentSide.Mentee}
        />
      </>,
    );
    expect(screen.getByText("Mentor olarak")).toBeInTheDocument();
    expect(screen.getByText("Mentee olarak")).toBeInTheDocument();
  });

  it("marks an Office Hours appointment as Office Hours whatever the side", () => {
    render(
      <AppointmentRoleLabel
        kind={AppointmentKind.OfficeHours}
        side={AppointmentSide.Mentee}
      />,
    );
    expect(screen.getByText("Office Hours")).toBeInTheDocument();
    expect(screen.queryByText("Mentee olarak")).toBeNull();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import { AppointmentStatus } from "@/interfaces/appointment";
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

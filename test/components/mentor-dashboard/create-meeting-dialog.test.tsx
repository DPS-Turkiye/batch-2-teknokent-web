import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { CreateMeetingDialog } from "@/components/mentor-dashboard/create-meeting-dialog";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { InLocale } from "@test/test-utils";

const regular: RegularMentorship = {
  id: "reg-1",
  mentorId: "mentor-1",
  mentorName: "Nihan Öztürk",
  organizationId: "org-9",
  organizationName: "Orbit",
  status: "ACTIVE",
  startDate: "2026-09-01",
  endDate: null,
  daysPerWeek: 2,
  goals: null,
  goalItems: [],
  progressPercent: 0,
};

function dialog(
  regularMentorships: RegularMentorship[] = [],
  {
    startAt = null,
    onSubmit = vi.fn(),
    error = null,
  }: {
    startAt?: Date | null;
    onSubmit?: ComponentProps<typeof CreateMeetingDialog>["onSubmit"];
    error?: Error | null;
  } = {},
) {
  return (
    <CreateMeetingDialog
      mentorName="Nihan Öztürk"
      mentorships={[]}
      programs={[]}
      regularMentorships={regularMentorships}
      startAt={startAt}
      isSaving={false}
      error={error}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />
  );
}

describe("CreateMeetingDialog", () => {
  it("explains that a meeting needs someone to meet", () => {
    render(dialog());

    expect(
      screen.getByText(/kabul edilmiş bir mentorluk veya/),
    ).toBeInTheDocument();
  });

  it("reads in English, with the regular mentorship's rhythm", () => {
    render(<InLocale locale="en">{dialog([regular])}</InLocale>);

    expect(
      screen.getByRole("dialog", { name: "Create a meeting" }),
    ).toBeInTheDocument();
    expect(screen.getByText("My regular mentorships:")).toBeInTheDocument();
    expect(screen.getByText("2 days a week · Regular")).toBeInTheDocument();
    expect(screen.getByText("Next 7 days")).toBeInTheDocument();
    expect(
      screen.getByText("I want a transcript of this meeting"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("sends without a link when the field is left empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      dialog([regular], { startAt: new Date("2026-09-18T11:00:00"), onSubmit }),
    );

    expect(
      screen.getByLabelText(/Google Meet linki/),
    ).toHaveAccessibleDescription(/Menton bağlantıyı kendisi oluşturur/);
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ meetLink: undefined }),
    );
  });

  it("sends the mentor's own Meet link and refuses another address", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      dialog([regular], { startAt: new Date("2026-09-18T11:00:00"), onSubmit }),
    );
    const field = screen.getByLabelText(/Google Meet linki/);

    await user.type(field, "https://example.com/oda");
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Geçerli bir Google Meet linki yapıştırın.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription(/Geçerli bir Google Meet linki/);

    await user.clear(field);
    await user.type(field, "https://meet.google.com/abc-defg-hij");
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
    );
  });

  it("shows why a meeting could not be saved", () => {
    render(dialog([regular], { error: new Error("Tüm kayıt yerleri dolu.") }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tüm kayıt yerleri dolu.",
    );
  });
});

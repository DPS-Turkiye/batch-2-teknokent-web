import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAvailabilitySlot } from "@/components/mentor-dashboard/_hooks/use-availability-slot";
import { MentorAvailabilityPanel } from "@/components/mentor-dashboard/availability-panel";

vi.mock("@/components/mentor-dashboard/_hooks/use-availability-slot", () => ({
  useAvailabilitySlot: vi.fn(),
}));

function baseHookState() {
  return {
    availabilityQuery: { isLoading: false, data: [] as unknown[] },
    startsAt: "",
    setStartsAt: vi.fn(),
    error: "",
    isCreating: false,
    isDeleting: false,
    addSlot: vi.fn(),
    removeSlot: vi.fn(),
  };
}

describe("MentorAvailabilityPanel", () => {
  it("renders nothing when there is no mentor id", () => {
    vi.mocked(useAvailabilitySlot).mockReturnValue(baseHookState());

    const { container } = render(<MentorAvailabilityPanel mentorId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an empty state when there are no slots", () => {
    vi.mocked(useAvailabilitySlot).mockReturnValue(baseHookState());

    render(<MentorAvailabilityPanel mentorId="mentor-1" />);

    expect(
      screen.getByText("Henüz tanımlı bir müsaitlik zamanınız yok."),
    ).toBeInTheDocument();
  });

  it("lets a booked slot be seen but not removed", () => {
    vi.mocked(useAvailabilitySlot).mockReturnValue({
      ...baseHookState(),
      availabilityQuery: {
        isLoading: false,
        data: [
          {
            id: "slot-1",
            startsAt: "2026-08-21T10:00:00.000Z",
            durationMinutes: 60,
            booked: true,
          },
        ],
      },
    });

    render(<MentorAvailabilityPanel mentorId="mentor-1" />);

    expect(screen.getByText("Rezerve")).toBeInTheDocument();
    expect(screen.queryByText("Kaldır")).not.toBeInTheDocument();
  });

  it("lets an unbooked slot be removed", () => {
    const removeSlot = vi.fn();
    vi.mocked(useAvailabilitySlot).mockReturnValue({
      ...baseHookState(),
      removeSlot,
      availabilityQuery: {
        isLoading: false,
        data: [
          {
            id: "slot-1",
            startsAt: "2026-08-21T10:00:00.000Z",
            durationMinutes: 60,
            booked: false,
          },
        ],
      },
    });

    render(<MentorAvailabilityPanel mentorId="mentor-1" />);

    fireEvent.click(screen.getByText("Kaldır"));
    expect(removeSlot).toHaveBeenCalledWith("slot-1");
  });

  it("disables the add button until a datetime is chosen", () => {
    vi.mocked(useAvailabilitySlot).mockReturnValue(baseHookState());

    render(<MentorAvailabilityPanel mentorId="mentor-1" />);

    expect(screen.getByText("Zaman Dilimi Ekle")).toBeDisabled();
  });

  it("surfaces a mutation error", () => {
    vi.mocked(useAvailabilitySlot).mockReturnValue({
      ...baseHookState(),
      error: "Zaman dilimi eklenemedi.",
    });

    render(<MentorAvailabilityPanel mentorId="mentor-1" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Zaman dilimi eklenemedi.",
    );
  });
});

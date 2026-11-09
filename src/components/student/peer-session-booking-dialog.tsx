"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { SlotDayTimePicker } from "@/components/mentor-request/slot-day-time-picker";
import { usePeerSessionBooking } from "@/hooks/use-peer-session-booking";
import type { PeerMentoringRequest } from "@/interfaces/peer-mentoring";

// Wide enough for four "09:00 · 30 dk" chips on a row.
const PANEL_CLASS =
  "w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl outline-none";

/** Pick one of the peer mentor's free times for an accepted request. */
export function PeerSessionBookingDialog({
  request,
  onClose,
}: {
  request: PeerMentoringRequest;
  onClose: () => void;
}) {
  const t = useTranslations(
    "odtuWorkspaces.student.peerMentoring.requests.booking",
  );
  const booking = usePeerSessionBooking(request.id, onClose);

  return (
    <ModalDialog
      labelledBy="peer-booking-title"
      onClose={onClose}
      panelClassName={PANEL_CLASS}
    >
      <div>
        <h2
          id="peer-booking-title"
          className="text-[19px] font-semibold text-[#22262b]"
        >
          {t("title", { name: request.mentor.fullName })}
        </h2>
        <p className="mt-1 text-[12.5px] text-[#676e78]">{t("subtitle")}</p>
      </div>
      {booking.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : booking.loadError ? (
        <p role="alert" className="text-sm text-[#b42318]">
          {booking.loadError.message}
        </p>
      ) : booking.slots.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#d6dade] px-4 py-5 text-sm text-[#676e78]">
          {t("empty")}
        </p>
      ) : (
        <SlotDayTimePicker
          slots={booking.slots}
          disabled={booking.isBooking}
          onPick={booking.book}
        />
      )}
      {booking.bookError ? (
        <p role="alert" className="text-sm text-[#b42318]">
          {booking.bookError.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center justify-center rounded-full border border-[#d4d8dd] bg-white px-3.5 text-[12.5px] font-medium text-[#4a5059] hover:bg-[#f8f9fa]"
        >
          {t("close")}
        </button>
      </div>
    </ModalDialog>
  );
}

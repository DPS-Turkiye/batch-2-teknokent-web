"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { PreferredTimesPicker } from "@/components/office-hours/preferred-times-picker";
import { useToast } from "@/components/providers/toast-provider";
import {
  useCreateOfficeHoursRequest,
  useInstructorSlots,
} from "@/hooks/use-office-hours-booking";
import type { OfficeHoursPerson } from "@/interfaces/office-hours";
import {
  emptyPreferredSlots,
  hasPreferredSlots,
  isValidPreferredSlot,
  preferredSlotMachineValue,
} from "@/lib/mentor-availability-days";
import { asAvailabilitySlots } from "@/lib/office-hours-booking";
import { errorMessage } from "@/lib/utils";

/** The student's request to an academic: what about, and up to three times, as a mentee asks a mentor. */
export function OfficeHoursRequestDialog({
  courseId,
  instructor,
  onClose,
}: {
  courseId: string;
  instructor: OfficeHoursPerson;
  onClose: () => void;
}) {
  const t = useTranslations("officeHours.booking.dialog");
  const { showToast } = useToast();
  const slotsQuery = useInstructorSlots(courseId, instructor.id);
  const createRequest = useCreateOfficeHoursRequest(courseId);
  const [topic, setTopic] = useState("");
  const [outcome, setOutcome] = useState("");
  const [preferredSlots, setPreferredSlots] = useState(emptyPreferredSlots);
  const [error, setError] = useState("");

  async function send() {
    if (!topic.trim()) {
      setError(t("needTopic"));
      return;
    }
    if (!hasPreferredSlots(preferredSlots)) {
      setError(t("needSlots"));
      return;
    }
    setError("");
    try {
      await createRequest.mutateAsync({
        instructorId: instructor.id,
        topic: topic.trim(),
        expectedOutcome: outcome.trim() || undefined,
        preferredSlots: preferredSlots
          .filter(isValidPreferredSlot)
          .map(preferredSlotMachineValue),
      });
      showToast({ message: t("sent"), tone: "success" });
      onClose();
    } catch (sendError) {
      setError(errorMessage(sendError, t("needSlots")));
    }
  }

  return (
    <ModalDialog
      labelledBy="office-hours-request-title"
      onClose={onClose}
      panelClassName="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] outline-none"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#eceef0] px-6 pb-4 pt-5">
        <h2
          id="office-hours-request-title"
          className="text-[19px] font-semibold text-[#22262b]"
        >
          {t("title", { name: instructor.fullName })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-[#676e78] hover:text-[#22262b]"
        >
          {t("close")}
        </button>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <label className="block rounded-[10px] border border-[#e4e7ea] p-4">
          <span className="text-sm font-medium text-[#22262b]">
            {t("topic")}
          </span>
          <textarea
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={t("topicPlaceholder")}
            maxLength={2000}
            className="mt-2 min-h-[64px] w-full rounded-lg border border-[#d4d8dd] px-3 py-2.5 text-sm text-[#22262b] outline-none placeholder:text-[#858c96]"
          />
        </label>
        <label className="block rounded-[10px] border border-[#e4e7ea] p-4">
          <span className="text-sm font-medium text-[#22262b]">
            {t("outcome")}
          </span>
          <textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder={t("outcomePlaceholder")}
            maxLength={2000}
            className="mt-2 min-h-[48px] w-full rounded-lg border border-[#d4d8dd] px-3 py-2.5 text-sm text-[#22262b] outline-none placeholder:text-[#858c96]"
          />
        </label>
        <PreferredTimesPicker
          slots={asAvailabilitySlots(slotsQuery.data ?? [])}
          value={preferredSlots}
          onChange={setPreferredSlots}
        />
        {error ? (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        ) : null}
      </div>
      <footer className="flex justify-end border-t border-[#eceef0] px-6 py-4">
        <button
          type="button"
          onClick={() => void send()}
          disabled={createRequest.isPending}
          className="rounded-full bg-[#e86f22] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#ce5e19] disabled:bg-[#c9cdd2]"
        >
          {createRequest.isPending ? t("sending") : t("send")}
        </button>
      </footer>
    </ModalDialog>
  );
}

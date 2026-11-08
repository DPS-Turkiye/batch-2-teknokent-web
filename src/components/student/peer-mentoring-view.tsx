"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/common/empty-state";
import { PeerMentorDirectory } from "@/components/student/peer-mentor-directory";
import { PeerMentoringRequests } from "@/components/student/peer-mentoring-requests";
import { usePeerMentoringSide } from "@/hooks/use-peer-mentoring";
import { AppointmentSide } from "@/interfaces/appointment";

const SIDES = [
  { side: AppointmentSide.Mentee, key: "get", ready: true },
  // Mentorluk Ver lands in its own screen PR, after the badge and dual-role work.
  { side: AppointmentSide.Mentor, key: "give", ready: false },
] as const;

export function PeerMentoringView() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring");
  const { side, setSide } = usePeerMentoringSide();

  return (
    <div className="space-y-8">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <div
        role="tablist"
        aria-label={t("switchLabel")}
        className="inline-flex gap-1 rounded-full bg-[#f4f5f7] p-1"
      >
        {SIDES.map((item) => {
          const selected = item.side === side;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={!item.ready}
              onClick={() => setSide(item.side)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] ${
                selected
                  ? "bg-white font-medium text-[#22262b] shadow-[0_1px_2px_rgba(33,38,43,0.08)]"
                  : "text-[#858c96]"
              } disabled:cursor-default disabled:text-[#cfd4da]`}
            >
              {t(`switch.${item.key}`)}
              {item.ready ? null : (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#858c96]">
                  {t("soon")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {side === AppointmentSide.Mentee ? (
        <div className="space-y-10">
          <PeerMentoringRequests />
          <PeerMentorDirectory />
        </div>
      ) : (
        <EmptyState
          className=""
          title={t("giveSoonTitle")}
          body={t("giveSoonBody")}
        />
      )}
    </div>
  );
}

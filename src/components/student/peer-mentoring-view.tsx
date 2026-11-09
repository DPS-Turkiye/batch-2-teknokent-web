"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/admin/admin-ui";
import { PeerMentorDirectory } from "@/components/student/peer-mentor-directory";
import { PeerMentorGiveView } from "@/components/student/peer-mentor-give-view";
import { PeerMentoringRequests } from "@/components/student/peer-mentoring-requests";
import { usePeerMentorGate } from "@/hooks/use-peer-mentor-give";
import { usePeerMentoringSide } from "@/hooks/use-peer-mentoring";
import { AppointmentSide } from "@/interfaces/appointment";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";

const SIDES = [
  { side: AppointmentSide.Mentee, key: "get" },
  { side: AppointmentSide.Mentor, key: "give" },
] as const;

export function PeerMentoringView() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring");
  const { side: asked, setSide } = usePeerMentoringSide();
  const gate = usePeerMentorGate();
  // Mentorluk Ver is there for İŞKUR students and peer mentors only; a link to it opens Mentorluk Al for anyone else.
  const canGive = gate.state !== PeerMentorGateState.Hidden;
  const side = canGive ? asked : AppointmentSide.Mentee;
  const sides = SIDES.filter(
    (item) => canGive || item.side === AppointmentSide.Mentee,
  );

  return (
    <div className="space-y-8">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <div
        role="tablist"
        aria-label={t("switchLabel")}
        className="inline-flex gap-1 rounded-full bg-[#f4f5f7] p-1"
      >
        {sides.map((item) => {
          const selected = item.side === side;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSide(item.side)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] ${
                selected
                  ? "bg-white font-medium text-[#22262b] shadow-[0_1px_2px_rgba(33,38,43,0.08)]"
                  : "text-[#858c96]"
              }`}
            >
              {t(`switch.${item.key}`)}
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
        <PeerMentorGiveView />
      )}
    </div>
  );
}

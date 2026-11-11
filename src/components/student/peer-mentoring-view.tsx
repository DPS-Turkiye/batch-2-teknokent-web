"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/ia/page-header";
import {
  Segmented,
  TabPanel,
  UnderlineTabs,
} from "@/components/student/iskur-ui";
import { PeerMentorDirectory } from "@/components/student/peer-mentor-directory";
import { PeerMentorGiveView } from "@/components/student/peer-mentor-give-view";
import { PeerMentoringRequests } from "@/components/student/peer-mentoring-requests";
import { usePeerMentorGate } from "@/hooks/use-peer-mentor-give";
import {
  useMyPeerMentorships,
  usePeerMentoringSide,
  usePeerTakeTab,
} from "@/hooks/use-peer-mentoring";
import { AppointmentSide } from "@/interfaces/appointment";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import { PeerTakeTab } from "@/types/iskur-student";

const TAKE_TABS_ID = "peer-take";

/** Akran Mentörlüğü: Mentorluk Al (Keşfet, Mentorluklarım), and Mentorluk Ver for İŞKUR students and peer mentors. */
export function PeerMentoringView() {
  const t = useTranslations("iaIskur.take");
  const { side: asked, setSide } = usePeerMentoringSide();
  const gate = usePeerMentorGate();
  // Mentorluk Ver is there for İŞKUR students and peer mentors only; a link to it opens Mentorluk Al for anyone else.
  const canGive = gate.state !== PeerMentorGateState.Hidden;
  const side = canGive ? asked : AppointmentSide.Mentee;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        actions={
          canGive ? (
            <Segmented
              label={t("switchLabel")}
              selected={side}
              onSelect={setSide}
              options={[
                { id: AppointmentSide.Mentee, label: t("switch.get") },
                {
                  id: AppointmentSide.Mentor,
                  label: t("switch.give"),
                  tour: "peer-mentoring-give-toggle",
                },
              ]}
            />
          ) : null
        }
      >
        <p className="type-body text-text-secondary">{t("subtitle")}</p>
      </PageHeader>
      {side === AppointmentSide.Mentee ? <TakeSide /> : <PeerMentorGiveView />}
    </div>
  );
}

function TakeSide() {
  const t = useTranslations("iaIskur.take.tabs");
  const { tab, setTab } = usePeerTakeTab();
  const mine = useMyPeerMentorships();
  return (
    <div className="space-y-7">
      <UnderlineTabs
        label={t("label")}
        idPrefix={TAKE_TABS_ID}
        selected={tab}
        onSelect={setTab}
        tabs={[
          { id: PeerTakeTab.Discover, label: t("discover") },
          {
            id: PeerTakeTab.Mine,
            label: t("mine"),
            ...(mine.query.data ? { count: mine.count } : {}),
          },
        ]}
      />
      <TabPanel
        idPrefix={TAKE_TABS_ID}
        id={PeerTakeTab.Discover}
        selected={tab === PeerTakeTab.Discover}
      >
        <PeerMentorDirectory />
      </TabPanel>
      <TabPanel
        idPrefix={TAKE_TABS_ID}
        id={PeerTakeTab.Mine}
        selected={tab === PeerTakeTab.Mine}
      >
        <PeerMentoringRequests
          onFindAnother={() => setTab(PeerTakeTab.Discover)}
        />
      </TabPanel>
    </div>
  );
}

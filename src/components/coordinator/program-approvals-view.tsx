"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  Avatar,
  EmptyNote,
  OutlineButton,
  Panel,
  QueryNotice,
  SolidButton,
} from "@/components/admin/admin-ui";
import { TeamHistory } from "@/components/common/team-history";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import {
  useProgramApprovals,
  useProgramWithoutTeam,
} from "@/hooks/use-program-approvals";
import { TeamChangeKind } from "@/interfaces/team-change";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { formatLongDate, initials } from "@/lib/utils";

export function ProgramApprovalsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Approvals}>
      {() => <ApprovalsBody programId={programId} />}
    </ProgramDetailFrame>
  );
}

function ApprovalsBody({ programId }: { programId: string }) {
  const t = useTranslations("programApprovals");
  const locale = useLocale();
  const approvals = useProgramApprovals(programId);
  if (!approvals.query.data) {
    return (
      <QueryNotice
        isLoading={approvals.query.isLoading}
        error={approvals.query.error}
      />
    );
  }

  const actions = (id: string, decide: (id: string, ok: boolean) => void) =>
    approvals.deciding === id ? (
      <span className="text-[12.5px] text-[#858c96]">{t("saving")}</span>
    ) : (
      <div className="flex shrink-0 gap-2">
        <OutlineButton onClick={() => decide(id, false)}>
          {t("reject")}
        </OutlineButton>
        <SolidButton onClick={() => decide(id, true)}>
          {t("approve")}
        </SolidButton>
      </div>
    );

  return (
    <div className="space-y-6">
      <Section title={t("peopleTitle")} hint={t("peopleHint")}>
        {approvals.people.length === 0 ? (
          <li>
            <EmptyNote>{t("peopleEmpty")}</EmptyNote>
          </li>
        ) : (
          approvals.people.map((person) => (
            <Row
              key={person.id}
              name={person.fullName}
              lines={[
                person.email,
                person.organizationName
                  ? t("withStartup", { name: person.organizationName })
                  : t("withoutStartup"),
                t("signedUp", {
                  date: formatLongDate(person.createdAt, locale),
                }),
              ]}
              action={actions(person.id, approvals.decidePerson)}
            />
          ))
        )}
      </Section>
      <Section title={t("startupsTitle")} hint={t("startupsHint")}>
        {approvals.startups.length === 0 ? (
          <li>
            <EmptyNote>{t("startupsEmpty")}</EmptyNote>
          </li>
        ) : (
          approvals.startups.map((startup) => (
            <Row
              key={startup.id}
              name={startup.name}
              lines={[
                startup.description ?? "",
                startup.founderName
                  ? t("createdBy", {
                      name: startup.founderName,
                      email: startup.founderEmail ?? "",
                    })
                  : "",
              ]}
              action={actions(startup.id, approvals.decideStartup)}
            />
          ))
        )}
      </Section>
      <Section title={t("teamChangesTitle")} hint={t("teamChangesHint")}>
        {approvals.teamChanges.length === 0 ? (
          <li>
            <EmptyNote>{t("teamChangesEmpty")}</EmptyNote>
          </li>
        ) : (
          approvals.teamChanges.map((change) => (
            <Row
              key={change.id}
              name={change.memberName}
              lines={[
                t(
                  change.kind === TeamChangeKind.Leave
                    ? "wantsToLeave"
                    : "removalAsked",
                  {
                    startup: change.organizationName,
                    leader: change.requestedByName,
                  },
                ),
                formatLongDate(change.createdAt, locale),
              ]}
              action={actions(change.id, approvals.decideTeamChange)}
            />
          ))
        )}
      </Section>
    </div>
  );
}

/** Takımı olmayanlar, on the Takımlar tab. */
export function ProgramWithoutTeam({ programId }: { programId: string }) {
  const t = useTranslations("programApprovals");
  const query = useProgramWithoutTeam(programId);
  if (!query.data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  return (
    <Section title={t("withoutTeamTitle")} hint={t("withoutTeamHint")}>
      {query.data.length === 0 ? (
        <li>
          <EmptyNote>{t("withoutTeamEmpty")}</EmptyNote>
        </li>
      ) : (
        query.data.map((person) => (
          <Row
            key={person.id}
            name={person.fullName}
            lines={[person.email, person.jobTitle ?? ""]}
          >
            <TeamHistory userId={person.id} />
          </Row>
        ))
      )}
    </Section>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-[16px] font-semibold text-[#22262b]">{title}</h2>
        <p className="text-[13px] text-[#858c96]">{hint}</p>
      </div>
      <Panel>
        <ul className="divide-y divide-[#f1f3f5]">{children}</ul>
      </Panel>
    </section>
  );
}

function Row({
  name,
  lines,
  action,
  children,
}: {
  name: string;
  lines: string[];
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar initials={initials(name)} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-[#22262b]">
            {name}
          </p>
          <p className="truncate text-[12.5px] text-[#858c96]">
            {lines.filter(Boolean).join(" · ")}
          </p>
          {children}
        </div>
      </div>
      {action}
    </li>
  );
}

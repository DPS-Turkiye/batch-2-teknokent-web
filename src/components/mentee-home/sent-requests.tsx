import Link from "next/link";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/common/avatar";
import { SectionHeader } from "@/components/mentee-home/section-header";
import { SectionPlaceholder } from "@/components/mentee-home/section-placeholder";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { requestStatusHref } from "@/lib/mentee-home";
import { initials } from "@/lib/utils";
import { SentRequestState } from "@/types/mentee-home";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

const REQUEST_LIMIT = 3;

export function SentRequests({
  requests,
  loading,
}: {
  requests: { request: MentorshipRequest; state: SentRequestState }[];
  loading: boolean;
}) {
  const t = useTranslations("menteeHome");
  return (
    <section
      aria-labelledby="home-requests-title"
      className="flex flex-col gap-3"
    >
      <SectionHeader
        id="home-requests-title"
        title={t("sent.title")}
        href={`/mentorships?tab=${MentorshipWorkspaceTab.Requests}`}
        linkText={t("all", { count: requests.length })}
      />
      {requests.slice(0, REQUEST_LIMIT).map(({ request, state }) => {
        const needsAction = state === SentRequestState.ActionNeeded;
        return (
          <article
            key={request.id}
            className={`relative flex flex-col gap-1 rounded-[20px] border-[0.685px] p-4 ${needsAction ? "border-[#e86f22] bg-[#fff4ec]" : "border-[#dde1e6] bg-white hover:bg-[#fcfcfd]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  initials={initials(request.mentorName) || "MN"}
                  tone="orange"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium leading-[21px] text-[#2b303a]">
                    {needsAction ? (
                      request.mentorName
                    ) : (
                      <Link
                        href={requestStatusHref(request.id)}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {request.mentorName}
                      </Link>
                    )}
                  </h3>
                  <p className="truncate text-xs leading-[18px] text-[#7a828d]">
                    {request.supportArea}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-[17.25px] ${needsAction ? "bg-white/60 text-[#e86f22]" : "bg-[#fdf5e6] text-[#9a6805]"}`}
              >
                <span
                  className={`size-1.5 rounded-full ${needsAction ? "bg-[#e86f22]" : "bg-[#d9930a]"}`}
                />
                {t(`sent.state.${state}`)}
              </span>
            </div>
            {needsAction && (
              <Link
                href={requestStatusHref(request.id)}
                className="flex h-8 w-full items-center justify-center rounded-xl bg-[#e86f22] px-3 text-xs font-semibold text-white hover:bg-[#d9631c]"
              >
                {t("sent.reply")}
              </Link>
            )}
          </article>
        );
      })}
      {requests.length === 0 && (
        <SectionPlaceholder loading={loading} emptyText={t("sent.empty")} />
      )}
    </section>
  );
}

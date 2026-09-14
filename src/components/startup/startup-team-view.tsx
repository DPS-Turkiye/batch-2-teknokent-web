"use client";

import Image from "next/image";

import { Avatar } from "@/components/common/avatar";
import {
  MemberFormDialog,
  RemoveMemberDialog,
} from "@/components/startup/startup-team-dialogs";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { formatLongDate, initials } from "@/lib/utils";

const AVATAR_TONES = ["orange", "teal", "purple"] as const;

export function StartupTeamView() {
  const team = useStartupTeam();

  if (team.isLoading) {
    return <p className="py-10 text-sm text-[#858c96]">Ekip yükleniyor…</p>;
  }
  if (team.error) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {team.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4 py-3">
      <section
        aria-labelledby="startup-team-title"
        className="space-y-4 rounded-[24px] bg-[#fff4ec] p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="startup-team-title"
              className="text-2xl leading-8 text-[#22262b]"
            >
              Ekip
            </h2>
            <p className="text-sm text-[#858c96]">
              {team.members.length} ekip üyesi
            </p>
          </div>
          <button
            type="button"
            onClick={team.openAdd}
            className="flex items-center gap-1.5 rounded-full bg-[#e86f22] px-4 py-2 text-sm text-white hover:bg-[#ce5e19]"
          >
            <Image src="/startup/plus-alt.svg" alt="" width={14} height={14} />
            Ekip Üyesi Ekle
          </button>
        </div>

        {team.members.length === 0 ? (
          <p className="text-sm text-[#858c96]">Henüz ekip üyesi eklenmedi.</p>
        ) : (
          <ul className="space-y-3">
            {team.members.map((member, index) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 rounded-[24px] bg-white px-4 py-3"
              >
                <Avatar
                  initials={initials(member.fullName) || "?"}
                  tone={AVATAR_TONES[index % AVATAR_TONES.length]}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm text-[#22262b]">
                    {member.fullName}
                    {member.founder ? (
                      <span className="rounded-full border border-[#fbe2d0] px-2 py-px text-[11px] text-[#e86f22]">
                        Kurucu
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-[#858c96]">
                    {[member.jobTitle, member.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {member.joinedAt ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-[#aeb4bc]">
                    <Image
                      src="/startup/calendar-bright.svg"
                      alt=""
                      width={14}
                      height={14}
                    />
                    Katılım: {formatLongDate(member.joinedAt)}
                  </span>
                ) : null}
                <div className="flex shrink-0 items-center gap-1">
                  {team.canEdit(member) ? (
                    <button
                      type="button"
                      onClick={() => team.openEdit(member)}
                      aria-label={`${member.fullName} düzenle`}
                      className="rounded-full border border-[#fff4ec] px-3 py-[5px] text-xs text-[#e86f22] transition hover:border-[#e86f22]"
                    >
                      Düzenle
                    </button>
                  ) : null}
                  {team.canRemove(member) ? (
                    <button
                      type="button"
                      onClick={() => team.askRemove(member.id)}
                      aria-label={`${member.fullName} ekipten çıkar`}
                      className="grid size-7 place-items-center rounded-md hover:bg-[#f8f9fa]"
                    >
                      <Image
                        src="/startup/trash.svg"
                        alt=""
                        width={16}
                        height={16}
                      />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MemberFormDialog team={team} />
      <RemoveMemberDialog
        isRemoving={team.isRemoving}
        member={team.removingMember}
        onCancel={team.cancelRemove}
        onConfirm={team.confirmRemove}
      />
    </div>
  );
}

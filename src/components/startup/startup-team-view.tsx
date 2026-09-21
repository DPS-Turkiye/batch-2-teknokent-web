"use client";

import {
  StartupPageFrame,
  startupPrimaryActionClass,
} from "@/components/startup/startup-page-frame";
import {
  MemberFormDialog,
  RemoveMemberDialog,
} from "@/components/startup/startup-team-dialogs";
import { usePendingMembers } from "@/hooks/use-pending-members";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { formatShortDate, initials } from "@/lib/utils";

const chipClass =
  "rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-[17px]";
const rowLinkClass = "text-xs font-medium leading-[18px] hover:underline";

export function StartupTeamView() {
  const team = useStartupTeam();
  const pendingMembers = usePendingMembers();

  const addAction = (
    <button
      type="button"
      onClick={team.openAdd}
      className={startupPrimaryActionClass}
    >
      Ekip üyesi ekle
    </button>
  );

  if (team.isLoading) {
    return (
      <StartupPageFrame action={addAction}>
        <p className="py-10 text-sm text-[#858c96]">Ekip yükleniyor…</p>
      </StartupPageFrame>
    );
  }
  if (team.error) {
    return (
      <StartupPageFrame>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {team.error.message}
        </p>
      </StartupPageFrame>
    );
  }

  return (
    <StartupPageFrame action={addAction}>
      <section
        aria-labelledby="startup-team-title"
        className="space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5"
      >
        <div className="space-y-1">
          <h2
            id="startup-team-title"
            className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
          >
            Ekip üyeleri
          </h2>
          <p className="text-[12.5px] leading-[19px] text-[#676e78]">
            Ekip üyeleri startup profilinde ve mentorluk görüşmelerinde görünür.
          </p>
        </div>

        {team.members.length === 0 ? (
          <p className="text-sm text-[#858c96]">Henüz ekip üyesi eklenmedi.</p>
        ) : (
          <ul className="space-y-3.5">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e4e7ea] px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-[38px] shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-xs font-semibold text-[#9e4400]"
                  >
                    {initials(member.fullName) || "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium leading-5 text-[#22262b]">
                      {member.fullName}
                    </p>
                    <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                      {[member.jobTitle, member.founder ? "Kurucu" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="w-[160px] truncate text-xs leading-[18px] text-[#858c96]">
                    {member.email}
                  </span>
                  <span className="w-[150px] text-xs leading-[18px] text-[#858c96]">
                    {member.joinedAt
                      ? `Katılım: ${formatShortDate(member.joinedAt)}`
                      : null}
                  </span>
                  {member.founder ? (
                    <span
                      className={`${chipClass} bg-[#fff4ec] text-[#9e4400]`}
                    >
                      Yönetici
                    </span>
                  ) : (
                    <span
                      className={`${chipClass} bg-[#f3f4f6] text-[#676e78]`}
                    >
                      Üye
                    </span>
                  )}
                  {team.canEdit(member) ? (
                    <button
                      type="button"
                      onClick={() => team.openEdit(member)}
                      aria-label={`${member.fullName} düzenle`}
                      className={`${rowLinkClass} text-[#676e78]`}
                    >
                      Düzenle
                    </button>
                  ) : null}
                  {team.canRemove(member) ? (
                    <button
                      type="button"
                      onClick={() => team.askRemove(member.id)}
                      aria-label={`${member.fullName} ekipten çıkar`}
                      className={`${rowLinkClass} text-[#c24135]`}
                    >
                      Çıkar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingMembers.pending.length ? (
        <section
          aria-labelledby="startup-pending-title"
          className="space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5"
        >
          <div className="space-y-1">
            <h2
              id="startup-pending-title"
              className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
            >
              Katılım bekleyenler
            </h2>
            <p className="text-[12.5px] leading-[19px] text-[#676e78]">
              Kayıtta eklediğin ekip arkadaşların davet koduyla katıldığında
              ekip üyelerine taşınır.
            </p>
          </div>
          <ul className="space-y-3.5">
            {pendingMembers.pending.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-[#e4e7ea] px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-[38px] shrink-0 place-items-center rounded-full bg-[#f3f4f6] text-xs font-semibold text-[#676e78]"
                  >
                    {initials(member.fullName) || "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium leading-5 text-[#22262b]">
                      {member.fullName}
                    </p>
                    {member.jobTitle ? (
                      <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                        {member.jobTitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {member.email ? (
                    <span className="w-[160px] truncate text-xs leading-[18px] text-[#858c96]">
                      {member.email}
                    </span>
                  ) : null}
                  <span className={`${chipClass} bg-[#fff8e6] text-[#8a5a00]`}>
                    Katılım bekleniyor
                  </span>
                  {team.viewerIsFounder ? (
                    <button
                      type="button"
                      onClick={() => pendingMembers.remove(member.id)}
                      disabled={pendingMembers.removingId === member.id}
                      aria-label={`${member.fullName} bekleyenlerden çıkar`}
                      className={`${rowLinkClass} text-[#c24135] disabled:opacity-60`}
                    >
                      Çıkar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MemberFormDialog team={team} />
      <RemoveMemberDialog
        isRemoving={team.isRemoving}
        member={team.removingMember}
        onCancel={team.cancelRemove}
        onConfirm={team.confirmRemove}
      />
    </StartupPageFrame>
  );
}

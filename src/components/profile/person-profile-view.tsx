import Link from "next/link";

import { PhotoAvatar } from "@/components/common/avatar";
import { ProfileCard } from "@/components/profile/profile-card";
import type { BackendUser } from "@/interfaces/session";
import type { UserProfile } from "@/interfaces/user-profile";
import { USER_ROLE_LABELS } from "@/lib/const/programs";
import {
  PERSON_PROFILE_VIEW_LABELS as LABELS,
  PROFILE_CHIP_CLASSES,
  PROFILE_LINK_CLASS,
  PROFILE_ROW_CLASS,
} from "@/lib/const/profile";
import { ProfileChipTone } from "@/lib/personal-profile";
import { initials } from "@/lib/utils";

export function PersonProfileView({
  user,
  profile,
  startupHref,
}: {
  user: BackendUser;
  profile: UserProfile | null;
  startupHref: string | null;
}) {
  const fullName = profile?.fullName || user.fullName;
  const jobTitle = profile?.jobTitle || user.jobTitle || "";
  const subtitle = [jobTitle, user.organizationName]
    .filter(Boolean)
    .join(" · ");
  const expertise = profile?.expertise ?? [];

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-[22px] px-4 pb-[72px] pt-3 sm:px-8 xl:px-[106px]">
      <header className="flex min-w-0 items-center gap-[18px]">
        <PhotoAvatar
          initials={initials(fullName)}
          photoUrl={null}
          className="size-[88px] shrink-0 text-[26px]"
          label={`${fullName} profil fotoğrafı`}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="break-words text-[28px] font-semibold leading-[1.5] text-[#22262b]">
            {fullName}
          </h1>
          {subtitle ? (
            <p className="text-[13.5px] leading-[21px] text-[#676e78]">
              {subtitle}
            </p>
          ) : null}
          <ul className="flex flex-wrap gap-2">
            <li
              className={`rounded-full border px-3 py-[5px] text-xs font-medium leading-[19px] ${PROFILE_CHIP_CLASSES[ProfileChipTone.Neutral]}`}
            >
              {USER_ROLE_LABELS[user.role]}
            </li>
          </ul>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-[18px]">
          <ProfileCard title={LABELS.about}>
            <p className="whitespace-pre-line text-[13px] leading-5 text-[#4a5059]">
              {profile?.bio?.trim() || LABELS.noBio}
            </p>
          </ProfileCard>
          {expertise.length > 0 ? (
            <ProfileCard title={LABELS.expertise}>
              <ul className="flex flex-wrap gap-2">
                {expertise.map((item) => (
                  <li
                    key={item}
                    className={`rounded-full border px-3 py-[5px] text-xs font-medium leading-[19px] ${PROFILE_CHIP_CLASSES[ProfileChipTone.Program]}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </ProfileCard>
          ) : null}
          {user.organizationName ? (
            <ProfileCard
              title={LABELS.startup}
              action={
                startupHref ? (
                  <Link href={startupHref} className={PROFILE_LINK_CLASS}>
                    {LABELS.startupLink}
                  </Link>
                ) : undefined
              }
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#eef7f0] text-[13px] font-semibold text-[#3f7d5a]"
                >
                  {initials(user.organizationName)}
                </span>
                <p className="truncate text-[14px] font-medium leading-[22px] text-[#22262b]">
                  {user.organizationName}
                </p>
              </div>
            </ProfileCard>
          ) : null}
        </div>
        <aside className="flex flex-col gap-[18px]">
          <ProfileCard title={LABELS.contact}>
            <dl className="flex flex-col gap-3">
              <div className={PROFILE_ROW_CLASS}>
                <dt className="text-[12px] text-[#676e78]">{LABELS.email}</dt>
                <dd className="min-w-0 truncate text-right font-medium text-[#4a5059]">
                  {user.email ? (
                    <a
                      href={`mailto:${user.email}`}
                      className="hover:underline"
                    >
                      {user.email}
                    </a>
                  ) : (
                    LABELS.dash
                  )}
                </dd>
              </div>
              <div className={PROFILE_ROW_CLASS}>
                <dt className="text-[12px] text-[#676e78]">{LABELS.role}</dt>
                <dd className="text-right font-medium text-[#4a5059]">
                  {jobTitle || LABELS.dash}
                </dd>
              </div>
              {profile?.linkedinUrl ? (
                <div className={PROFILE_ROW_CLASS}>
                  <dt className="text-[12px] text-[#676e78]">
                    {LABELS.linkedin}
                  </dt>
                  <dd>
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={PROFILE_LINK_CLASS}
                    >
                      {LABELS.linkedinOpen}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </ProfileCard>
        </aside>
      </div>
    </main>
  );
}

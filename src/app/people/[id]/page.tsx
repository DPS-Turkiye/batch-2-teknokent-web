"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import type { UserProfile } from "@/interfaces/user-profile";
import type { BackendUser } from "@/interfaces/session";
import { UserRole } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { PERSON_PROFILE_LABELS, USER_ROLE_LABELS } from "@/lib/const/programs";
import { httpClient } from "@/lib/http-client";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

async function getPerson(userId: string) {
  return requireSuccess(
    await httpClient.get<BackendUser>(
      `/api/users/${encodeURIComponent(userId)}`,
    ),
  );
}

async function getPersonProfile(userId: string) {
  return requireSuccess(
    await httpClient.get<UserProfile>(
      `/api/users/${encodeURIComponent(userId)}/profile`,
    ),
  );
}

export default function PersonProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = useAppSession();
  const userQuery = useQuery({
    queryKey: ["person", params.id],
    queryFn: () => getPerson(params.id),
    enabled: Boolean(params.id),
  });
  const profileQuery = useQuery({
    queryKey: ["person-profile", params.id],
    queryFn: () => getPersonProfile(params.id),
    enabled: Boolean(params.id),
  });

  useEffect(() => {
    if (userQuery.data?.role === UserRole.Mentor) {
      router.replace(`/mentors/${encodeURIComponent(params.id)}`);
    }
  }, [userQuery.data?.role, params.id, router]);

  const homeHref =
    session?.role === UserRole.Mentor ? "/mentor-dashboard" : "/dashboard";
  const user = userQuery.data;
  const profile = profileQuery.data;

  return (
    <AppShell
      active={AppArea.Home}
      menteeHome={session?.role === UserRole.Mentee}
      mentorHome={session?.role === UserRole.Mentor}
    >
      <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-3 sm:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#676e78]">
          <Link href={homeHref} className="hover:text-[#22262b]">
            {PERSON_PROFILE_LABELS.home}
          </Link>
          <span>›</span>
          <span className="font-medium text-[#4a5059]">
            {PERSON_PROFILE_LABELS.profile}
          </span>
        </nav>

        {userQuery.isLoading || profileQuery.isLoading ? (
          <p className="mt-10 text-sm text-[#858c96]">
            {PERSON_PROFILE_LABELS.loading}
          </p>
        ) : !user ? (
          <p
            role="alert"
            className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {userQuery.error?.message ?? PERSON_PROFILE_LABELS.notFound}
          </p>
        ) : user.role === UserRole.Mentor ? (
          <p className="mt-10 text-sm text-[#858c96]">
            {PERSON_PROFILE_LABELS.redirecting}
          </p>
        ) : (
          <article className="mt-6 rounded-[24px] border border-[#e4e7ea] bg-white px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-full bg-[#fdebdd] text-base font-semibold text-[#a8480e]">
                {initials(user.fullName)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[24px] font-semibold text-[#22262b]">
                  {user.fullName}
                </h1>
                <p className="mt-1 text-sm text-[#676e78]">
                  {[
                    USER_ROLE_LABELS[user.role],
                    user.jobTitle,
                    user.organizationName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            {profile?.bio ? (
              <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#4a5059]">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-5 text-sm text-[#858c96]">
                {PERSON_PROFILE_LABELS.noBio}
              </p>
            )}

            {profile?.expertise && profile.expertise.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.expertise.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#fdebdd] bg-[#fff4ec] px-2.5 py-1 text-[11.5px] font-medium text-[#9e4400]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            {profile?.linkedinUrl ? (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-sm font-medium text-[#e86f22] hover:underline"
              >
                {PERSON_PROFILE_LABELS.linkedin}
              </a>
            ) : null}
          </article>
        )}
      </div>
    </AppShell>
  );
}

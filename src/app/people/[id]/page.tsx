"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PersonProfileView } from "@/components/profile/person-profile-view";
import { useAppSession } from "@/components/providers/session-provider";
import { UserRole, type BackendUser } from "@/interfaces/session";
import type { UserProfile } from "@/interfaces/user-profile";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import { organizationStartupHref } from "@/lib/program-links";
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
  const t = useTranslations("personProfile");
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

  const isOwnProfile =
    session?.role === UserRole.Mentee && session.userId === params.id;

  useEffect(() => {
    if (userQuery.data?.role === UserRole.Mentor) {
      router.replace(`/mentors/${encodeURIComponent(params.id)}`);
    } else if (isOwnProfile) {
      router.replace("/profile/personal");
    }
  }, [userQuery.data?.role, params.id, router, isOwnProfile]);

  const homeHref =
    session?.role === UserRole.Mentor ? "/mentor-dashboard" : "/dashboard";
  const user = userQuery.data;
  const profile = profileQuery.data;
  const startupHref = !user?.organizationId
    ? null
    : session?.role === UserRole.Mentor
      ? organizationStartupHref(user.organizationId)
      : session?.organizationId === user.organizationId
        ? "/startup"
        : null;

  return (
    <AppShell
      active={AppArea.Home}
      menteeHome={session?.role === UserRole.Mentee}
      mentorHome={session?.role === UserRole.Mentor}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-3 sm:px-8 xl:px-[106px]">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#676e78]">
          <Link href={homeHref} className="hover:text-[#22262b]">
            {t("home")}
          </Link>
          <span>›</span>
          <span className="font-medium text-[#4a5059]">{t("profile")}</span>
        </nav>

        {userQuery.isLoading || profileQuery.isLoading ? (
          <p className="mt-10 text-sm text-[#858c96]">{t("loading")}</p>
        ) : !user ? (
          <p
            role="alert"
            className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {userQuery.error?.message ?? t("notFound")}
          </p>
        ) : user.role === UserRole.Mentor || isOwnProfile ? (
          <p className="mt-10 text-sm text-[#858c96]">
            {isOwnProfile ? t("redirectingOwn") : t("redirecting")}
          </p>
        ) : null}
      </div>
      {user && user.role !== UserRole.Mentor && !isOwnProfile ? (
        <div className="mt-4">
          <PersonProfileView
            user={user}
            profile={profile ?? null}
            startupHref={startupHref}
          />
        </div>
      ) : null}
    </AppShell>
  );
}

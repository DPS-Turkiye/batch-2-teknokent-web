"use client";

import { useToast } from "@/components/providers/toast-provider";

import { AppShell } from "@/components/hoc/app-shell";
import {
  useDecidePendingAccount,
  usePendingAccounts,
} from "@/hooks/use-pending-accounts";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { AppArea } from "@/types/app-area";

export default function AdminPage() {
  const { showToast } = useToast();
  const pendingQuery = usePendingAccounts();
  const decide = useDecidePendingAccount();

  async function decideAccount(
    userId: string,
    status: UserAccountStatus.Approved | UserAccountStatus.Rejected,
  ) {
    try {
      const result = await decide.mutateAsync({ userId, status });
      if (status === UserAccountStatus.Rejected) {
        showToast({
          message: `${result.user.fullName} reddedildi.`,
          tone: "success",
        });
        return;
      }
      showToast({
        message: result.inviteCode
          ? `${result.user.fullName} onaylandı. Davet kodu: ${result.inviteCode}`
          : `${result.user.fullName} onaylandı.`,
        tone: "success",
      });
    } catch (reason) {
      showToast({
        message:
          reason instanceof Error
            ? reason.message
            : "Başvuru kararı kaydedilemedi.",
        tone: "error",
      });
    }
  }

  return (
    <AppShell active={AppArea.Admin} title="Başvurular">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-12 pt-6 sm:px-8">
        <p className="text-sm text-[#6a7282]">
          Kurucu ve mentor başvuruları onaylanmadan uygulamaya giremez.
        </p>
        {pendingQuery.isLoading ? (
          <p className="text-sm text-[#6a7282]">Yükleniyor...</p>
        ) : pendingQuery.error ? (
          <p className="text-sm text-red-600">{pendingQuery.error.message}</p>
        ) : !pendingQuery.data?.length ? (
          <p className="text-sm text-[#6a7282]">Bekleyen başvuru yok.</p>
        ) : (
          <div className="space-y-3">
            {pendingQuery.data.map((user) => (
              <article
                key={user.id}
                className="rounded-xl border border-[#e5e7eb] bg-white p-5"
              >
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="mt-1 text-xs text-[#6a7282]">
                  {user.email}
                  {user.jobTitle ? ` · ${user.jobTitle}` : ""}
                  {user.organizationName ? ` · ${user.organizationName}` : ""}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
                  {user.role === UserRole.Mentor ? "Mentor" : "Kurucu"}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={decide.isPending}
                    onClick={() =>
                      void decideAccount(user.id, UserAccountStatus.Approved)
                    }
                    className="rounded-lg bg-[#e86f22] px-3 py-2 text-sm font-semibold text-white disabled:bg-[#c9cdd2]"
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    disabled={decide.isPending}
                    onClick={() =>
                      void decideAccount(user.id, UserAccountStatus.Rejected)
                    }
                    className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-medium text-[#364153] disabled:opacity-50"
                  >
                    Reddet
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

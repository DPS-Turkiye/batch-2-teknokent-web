"use client";

import { useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { PrimaryButton } from "@/components/common/primary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { useToast } from "@/components/providers/toast-provider";
import {
  useOrganizationInvite,
  useRotateInviteCode,
} from "@/hooks/use-organization-invite";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

export default function TeamPage() {
  const { showToast } = useToast();
  const membersQuery = useOrganizationMembers();
  const inviteQuery = useOrganizationInvite();
  const rotate = useRotateInviteCode();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    const code = inviteQuery.data?.inviteCode;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    showToast({ message: "Davet kodu kopyalandı.", tone: "success" });
  }

  async function rotateCode() {
    setCopied(false);
    try {
      await rotate.mutateAsync();
      showToast({ message: "Yeni davet kodu üretildi.", tone: "success" });
    } catch (reason) {
      showToast({
        message:
          reason instanceof Error ? reason.message : "Yeni kod üretilemedi.",
        tone: "error",
      });
    }
  }

  return (
    <AppShell active={AppArea.Team} title="Ekibim" backHref="/dashboard">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-12 pt-6 sm:px-8">
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-semibold text-[#364153]">Davet kodu</h2>
          <p className="mt-1 text-xs text-[#6a7282]">
            Ekip arkadaşın /invite sayfasında bu kodla kayıt olur.
          </p>
          {inviteQuery.isLoading ? (
            <p className="mt-4 text-sm text-[#6a7282]">Yükleniyor...</p>
          ) : inviteQuery.error ? (
            <p className="mt-4 text-sm text-red-600">
              {inviteQuery.error.message}
            </p>
          ) : (
            <>
              <p className="mt-4 font-mono text-2xl tracking-widest">
                {inviteQuery.data?.inviteCode}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton onClick={() => void copyCode()}>
                  {copied ? "Kopyalandı" : "Kopyala"}
                </PrimaryButton>
                <button
                  type="button"
                  disabled={rotate.isPending}
                  onClick={() => void rotateCode()}
                  className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-medium text-[#364153] disabled:opacity-50"
                >
                  {rotate.isPending ? "Üretiliyor..." : "Yeni kod üret"}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-semibold text-[#364153]">
            Ekip Üyeleri
          </h2>
          {membersQuery.isLoading ? (
            <p className="mt-4 text-sm text-[#6a7282]">Yükleniyor...</p>
          ) : membersQuery.error ? (
            <p className="mt-4 text-sm text-red-600">
              {membersQuery.error.message}
            </p>
          ) : !membersQuery.data || membersQuery.data.length === 0 ? (
            <p className="mt-4 text-sm text-[#6a7282]">
              Henüz eklenmiş bir ekip üyesi yok.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {membersQuery.data.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-3"
                >
                  <Avatar initials={initials(member.fullName) || "??"} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#171717]">
                      {member.fullName}
                    </p>
                    <p className="text-xs text-[#6a7282]">
                      {member.email}
                      {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

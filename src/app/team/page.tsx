"use client";

import { useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { PrimaryButton } from "@/components/common/primary-button";
import { AppShell } from "@/components/hoc/app-shell";
import {
  useOrganizationInvite,
  useRotateInviteCode,
} from "@/hooks/use-organization-invite";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

export default function TeamPage() {
  const membersQuery = useOrganizationMembers();
  const inviteQuery = useOrganizationInvite();
  const rotate = useRotateInviteCode();
  const [copied, setCopied] = useState(false);
  const [rotateError, setRotateError] = useState("");

  async function copyCode() {
    const code = inviteQuery.data?.inviteCode;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
  }

  async function rotateCode() {
    setRotateError("");
    setCopied(false);
    try {
      await rotate.mutateAsync();
    } catch (reason) {
      setRotateError(
        reason instanceof Error ? reason.message : "Could not rotate the code.",
      );
    }
  }

  return (
    <AppShell active={AppArea.Team} title="Ekibim" backHref="/dashboard">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-12 pt-6 sm:px-8">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Geçici arayüz — tasarım ekibinden gelecek gerçek tasarımla
          değiştirilecektir.
        </p>

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
              {rotateError ? (
                <p className="mt-3 text-sm text-red-600">{rotateError}</p>
              ) : null}
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

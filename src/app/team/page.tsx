"use client";

import { useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { PrimaryButton } from "@/components/common/primary-button";
import { AppShell } from "@/components/hoc/app-shell";
import {
  useAddOrganizationMember,
  useOrganizationMembers,
} from "@/hooks/use-organization-members";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

export default function TeamPage() {
  const membersQuery = useOrganizationMembers();
  const addMember = useAddOrganizationMember();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      setError("Ad soyad ve e-posta gereklidir.");
      return;
    }
    setError("");
    try {
      await addMember.mutateAsync({
        fullName,
        email,
        jobTitle: jobTitle || undefined,
      });
      setFullName("");
      setEmail("");
      setJobTitle("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Ekip üyesi eklenemedi.",
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

        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-semibold text-[#364153]">
            Ekip Üyesi Ekle
          </h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-[#4b5563]">
              <span>Ad Soyad</span>
              <input
                className="rounded-md border border-[#d1d5db] bg-white p-2 text-sm font-normal"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#4b5563]">
              <span>E-posta</span>
              <input
                type="email"
                className="rounded-md border border-[#d1d5db] bg-white p-2 text-sm font-normal"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#4b5563]">
              <span>Unvan (opsiyonel)</span>
              <input
                className="rounded-md border border-[#d1d5db] bg-white p-2 text-sm font-normal"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <PrimaryButton
              className="mt-2 w-fit"
              disabled={addMember.isPending}
              onClick={() => void handleSubmit()}
            >
              {addMember.isPending ? "Ekleniyor..." : "Ekip Üyesi Ekle"}
            </PrimaryButton>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

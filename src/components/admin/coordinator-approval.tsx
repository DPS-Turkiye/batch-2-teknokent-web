"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Shield, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminIcon, AdminOverlay } from "@/components/admin/admin-ui";
import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { useDecidePendingAccount } from "@/hooks/use-pending-accounts";
import type { AdminProgram, AdminUser } from "@/interfaces/admin-overview";
import { UserAccountStatus } from "@/interfaces/session";
import { addProgramCoordinator } from "@/lib/client/coordinator-programs";
import { errorMessage, initials } from "@/lib/utils";

const CAPABILITIES = [
  "Program ayarları",
  "Takvim ve etkinlik",
  "Mentorluklar",
  "Mesajlar",
  "Programı arşivle",
];

export function CoordinatorApplicationDialog({
  user,
  programs,
  appliedLabel,
  busy,
  onClose,
  onReject,
  onApprove,
}: {
  user: AdminUser;
  programs: AdminProgram[];
  appliedLabel: string | null;
  busy: boolean;
  onClose: () => void;
  onReject: () => void;
  onApprove: () => void;
}) {
  const domain = user.email.split("@")[1] ?? user.email;
  const checks = [
    {
      title: "Kayıtlı e-posta",
      detail: domain,
    },
    programs.length === 0
      ? {
          title: "Başka programa atanmamış",
          detail: "çakışan koordinatörlük yok",
        }
      : {
          title: `${programs.length} programa atanmış`,
          detail: programs.map((program) => program.name).join(", "),
        },
  ];

  return (
    <AdminOverlay label={`${user.fullName} başvurusu`} onClose={onClose}>
      <div
        className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-[580px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 px-7 pt-7 pb-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[16px] font-semibold text-[#a8480e]">
            {initials(user.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[20px] leading-[1.3] font-semibold text-[#22262b]">
                {user.fullName}
              </p>
              <span className="rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[11.5px] font-medium text-[#676e78]">
                Koordinatör başvurusu
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff6e5] px-2.5 py-1 text-[11.5px] font-medium text-[#b7791f]">
                <span className="size-1.5 rounded-full bg-[#b7791f]" />
                Onay bekliyor
              </span>
            </div>
            <p className="mt-1 truncate text-[12.5px] text-[#858c96]">
              {user.email}
              {appliedLabel ? ` · başvuru ${appliedLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[#676e78]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-7 pb-7">
          <div className="flex items-start gap-2.5 rounded-[20px] bg-[#fff6e5] px-4 py-3.5">
            <Shield className="mt-0.5 size-[18px] shrink-0 text-[#b7791f]" />
            <p className="text-[13px] leading-[1.3] font-medium text-[#22262b]">
              Bu kişiyi koordinatör olarak onaylayacaksan bir program
              seçeceksin. Hesaba uygulama içi bildirim gider.
            </p>
          </div>

          <section className="space-y-2.5">
            <h2 className="text-[12px] font-semibold tracking-wide text-[#858c96]">
              BAŞVURU
            </h2>
            <dl className="space-y-2.5 rounded-[20px] bg-[#f7f8fa] px-4 py-3.5 text-[12.5px]">
              <Fact
                label="Kurum"
                value={user.organizationName ?? "Belirtilmedi"}
              />
              <Fact label="Unvan" value={user.jobTitle ?? "Belirtilmedi"} />
              <Fact label="Rol" value="Program koordinatörü" />
              <Fact label="E-posta" value={user.email} />
            </dl>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-[12px] font-semibold tracking-wide text-[#858c96]">
              KAYIT
            </h2>
            <ul className="overflow-hidden rounded-[20px] border border-[#e9ecef]">
              {checks.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center gap-3 border-b border-[#f0f2f4] px-4 py-3 last:border-0"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-[7px] bg-[#2f9e6b] text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-[#22262b]">
                      {item.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-[#858c96]">
                      {item.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-[#f0f2f4] px-7 pt-4 pb-6">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="rounded-full px-3.5 py-2 text-[12.5px] font-medium text-[#22262b] disabled:opacity-50"
          >
            Reddet
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#22262b] px-3.5 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
          >
            Onayla
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}

export function ApproveCoordinatorDialog({
  user,
  programs,
  onClose,
  onApproved,
  onFailed,
}: {
  user: AdminUser;
  programs: AdminProgram[];
  onClose: () => void;
  onApproved: (programName: string, already?: boolean) => void;
  onFailed: (message: string) => void;
}) {
  const decide = useDecidePendingAccount();
  const queryClient = useQueryClient();
  const [programId, setProgramId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [saving, setSaving] = useState(false);
  const selected = programs.find((program) => program.id === programId) ?? null;
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr");
    if (!needle) return programs;
    return programs.filter((program) =>
      program.name.toLocaleLowerCase("tr").includes(needle),
    );
  }, [programs, query]);

  async function confirm() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await decide.mutateAsync({
        userId: user.id,
        status: UserAccountStatus.Approved,
      });
    } catch (error) {
      setSaving(false);
      onFailed(errorMessage(error, "Onay kaydedilemedi."));
      return;
    }
    if (selected.coordinatorId === user.id) {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      onApproved(selected.name, true);
      return;
    }
    try {
      await addProgramCoordinator(selected.id, user.id);
      await queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      onApproved(selected.name);
    } catch (error) {
      const detail = errorMessage(error, "Atama kaydedilemedi.");
      if (detail.includes("zaten bu programın koordinatörü")) {
        await queryClient.invalidateQueries({
          queryKey: ADMIN_OVERVIEW_QUERY_KEY,
        });
        onApproved(selected.name, true);
        return;
      }
      setSaving(false);
      onFailed(`${user.fullName} onaylandı, programa atanamadı. ${detail}`);
    }
  }

  return (
    <AdminOverlay
      label={`${user.fullName} onay`}
      className="z-[60]"
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form
        className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-[600px] flex-col gap-5 overflow-y-auto rounded-[28px] bg-white p-7 shadow-[0_16px_48px_rgba(33,38,43,0.16)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] leading-[1.3] font-semibold text-[#22262b]">
              {user.fullName} için koordinatör onayı
            </h2>
            <p className="mt-1.5 text-[13px] leading-[1.45] text-[#676e78]">
              Onaydan sonra hesaba uygulama içi bildirim gider ve seçtiğin
              programın koordinatörü olur.
            </p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            disabled={saving}
            onClick={onClose}
            className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[#676e78] disabled:opacity-50"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex gap-1.5 text-[12.5px]">
            <span className="font-medium text-[#22262b]">Atanacak program</span>
            <span className="text-[#858c96]">aranabilir</span>
          </div>
          <div className="relative">
            <label className="flex items-center gap-2 rounded-full border border-[#e9ecef] py-[11px] pr-3.5 pl-4">
              <AdminIcon src="/admin/search.svg" width={16} height={16} />
              <input
                aria-label="Atanacak program"
                value={openList ? query : (selected?.name ?? query)}
                placeholder="Program ara"
                onFocus={() => {
                  setOpenList(true);
                  setQuery(selected?.name ?? "");
                }}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setProgramId(null);
                  setOpenList(true);
                }}
                className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-[#22262b] outline-none"
              />
            </label>
            {openList ? (
              <ul className="absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-[#e9ecef] bg-white p-1 shadow-[0_8px_24px_rgba(33,38,43,0.12)]">
                {matches.length === 0 ? (
                  <li className="px-3 py-2 text-[13px] text-[#858c96]">
                    Program yok.
                  </li>
                ) : (
                  matches.map((program) => {
                    const already = program.coordinatorId === user.id;
                    return (
                      <li key={program.id}>
                        <button
                          type="button"
                          disabled={already}
                          onClick={() => {
                            setProgramId(program.id);
                            setQuery(program.name);
                            setOpenList(false);
                          }}
                          className="block w-full rounded-xl px-3 py-2 text-left text-[13.5px] font-medium text-[#22262b] hover:bg-[#f5f6f8] disabled:text-[#858c96] disabled:hover:bg-transparent"
                        >
                          {program.name}
                          {already ? " · zaten koordinatör" : ""}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[12.5px] font-medium text-[#22262b]">
            Koordinatör yetkisi
          </p>
          <div className="flex flex-wrap gap-2">
            {CAPABILITIES.map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#eaf7f0] px-2.5 py-1 text-[11.5px] font-medium text-[#2f9e6b]"
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-full border border-[#e9ecef] bg-white px-5 py-[11px] text-[13.5px] font-medium text-[#22262b] disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={!selected || saving}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {saving ? "Kaydediliyor…" : "Onayla ve programa ata"}
          </button>
        </div>
      </form>
    </AdminOverlay>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#676e78]">{label}</dt>
      <dd className="truncate font-medium text-[#22262b]">{value}</dd>
    </div>
  );
}

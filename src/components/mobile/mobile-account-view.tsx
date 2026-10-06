"use client";

import { MobileListSkeleton } from "@/components/mobile/mobile-states";
import { MobileToggle } from "@/components/mobile/mobile-toggle";
import { MobileTopBar } from "@/components/mobile/mobile-top-bar";
import { useMobileAccount } from "@/hooks/use-mobile-account";
import { PushDeviceState } from "@/hooks/use-push-device";

const CARD_CLASS = "w-full rounded-[24px] bg-white";

const PUSH_HINTS: Record<PushDeviceState, string> = {
  [PushDeviceState.Checking]: "Kontrol ediliyor…",
  [PushDeviceState.Unsupported]: "Bu tarayıcı bildirimleri desteklemiyor.",
  [PushDeviceState.NeedsInstall]:
    "iPhone’da bildirim için Paylaş → Ana Ekrana Ekle ile Menton’u ekle.",
  [PushDeviceState.Off]: "Telefonuna anlık bildirim gelsin.",
  [PushDeviceState.On]: "Açık",
  [PushDeviceState.Blocked]: "Tarayıcı ayarlarından bildirim izni ver.",
};

function PushDeviceRow({
  push,
}: {
  push: ReturnType<typeof useMobileAccount>["push"];
}) {
  return (
    <div className="flex items-center gap-3 px-[18px] py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
        <p className="text-[15px] font-medium text-[#22262b]">
          Bu cihazda bildirimler
        </p>
        <p className="text-[12.5px] text-[#858c96]">
          {push.failed ? "Açılamadı. Tekrar dene." : PUSH_HINTS[push.state]}
        </p>
      </div>
      {push.state === PushDeviceState.Off ? (
        <button
          type="button"
          onClick={() => void push.enable()}
          disabled={push.isEnabling}
          className="shrink-0 rounded-full bg-[var(--mobile-accent)] px-4 py-2.5 text-[13.5px] leading-[1.35] font-semibold text-white disabled:opacity-50"
        >
          Aç
        </button>
      ) : null}
    </div>
  );
}

export function MobileAccountView() {
  const account = useMobileAccount();

  return (
    <div className="min-h-dvh bg-[#fbfbfc]">
      <MobileTopBar
        title="Hesap"
        backHref={account.backHref}
        backLabel="Ana sayfaya dön"
        tone="white"
      />
      <div className="flex flex-col gap-6 px-5 pt-2 pb-10">
        <section className="flex flex-col items-center gap-2.5 text-center leading-[1.35]">
          <span
            className={`flex size-20 items-center justify-center rounded-[26px] text-[29px] font-semibold ${account.avatarClass}`}
          >
            {account.initials}
          </span>
          <p className="text-xl font-semibold text-[#22262b]">
            {account.fullName}
          </p>
          <p className="text-sm text-[#676e78]">{account.email}</p>
          {account.chip ? (
            <span
              className={`rounded-full px-2.5 py-[5px] text-xs font-medium ${account.avatarClass}`}
            >
              {account.chip}
            </span>
          ) : null}
        </section>

        <section className="flex flex-col gap-2" aria-label="Bildirimler">
          <h2 className="text-[13px] leading-[1.35] font-semibold text-[#858c96]">
            BİLDİRİMLER
          </h2>
          <div className={`${CARD_CLASS} py-1`}>
            <PushDeviceRow push={account.push} />
          </div>
          {account.preferencesLoading ? (
            <MobileListSkeleton label="Bildirim ayarları yükleniyor" />
          ) : account.preferences ? (
            <ul className={`${CARD_CLASS} divide-y divide-[#f0f2f4] py-1`}>
              {account.rows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center gap-3 px-[18px] py-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
                    <p className="text-[15px] font-medium text-[#22262b]">
                      {row.label}
                    </p>
                    {row.hint ? (
                      <p className="text-[12.5px] text-[#858c96]">{row.hint}</p>
                    ) : null}
                  </div>
                  <MobileToggle
                    label={row.label}
                    checked={account.preferences?.[row.key] ?? false}
                    onChange={() => account.toggle(row.key)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-[1.35] text-[#d9464b]">
              Bildirim ayarları yüklenemedi.
            </p>
          )}
          {account.saveFailed ? (
            <p
              role="alert"
              className="text-[12.5px] leading-[1.35] text-[#d9464b]"
            >
              Ayar kaydedilemedi. Tekrar dene.
            </p>
          ) : null}
        </section>

        <section
          className={`${CARD_CLASS} flex items-center gap-3 px-[18px] py-4`}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
            <p className="text-[15px] font-medium text-[#22262b]">
              {account.webEdit.title}
            </p>
            <p className="text-[12.5px] text-[#858c96]">
              {account.webEdit.hint}
            </p>
          </div>
          <a
            href={account.webEdit.href}
            className="shrink-0 rounded-full border border-[#e9ecef] bg-white px-4 py-2.5 text-[13.5px] leading-[1.35] font-semibold text-[#22262b]"
          >
            Web’de Aç
          </a>
        </section>

        <button
          type="button"
          onClick={() => void account.signOut()}
          disabled={account.isSigningOut}
          className={`${CARD_CLASS} px-[18px] py-4 text-[15px] leading-[1.35] font-semibold text-[#d9464b] disabled:opacity-50`}
        >
          {account.isSigningOut ? "Çıkış yapılıyor…" : "Çıkış yap"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useInviteCodeCard } from "@/hooks/use-organization-invite";

export function StartupInviteCode() {
  const invite = useInviteCodeCard();

  return (
    <section
      aria-labelledby="startup-invite-title"
      className="space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5"
    >
      <div className="space-y-1">
        <h2
          id="startup-invite-title"
          className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
        >
          Davet kodu
        </h2>
        <p className="text-[12.5px] leading-[19px] text-[#676e78]">
          Ekip arkadaşın /invite sayfasında bu kodla kayıt olur.
        </p>
      </div>

      {invite.isLoading ? (
        <p className="text-sm text-[#858c96]">Davet kodu yükleniyor…</p>
      ) : invite.error ? (
        <p role="alert" className="text-sm text-[#c24135]">
          {invite.error.message}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="font-mono text-2xl leading-8 tracking-widest text-[#22262b]">
            {invite.code}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void invite.copy()}
              className="rounded-[10px] bg-[#e5701d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ce5e19]"
            >
              {invite.copied ? "Kopyalandı" : "Kopyala"}
            </button>
            <button
              type="button"
              disabled={invite.isRotating}
              onClick={() => void invite.rotate()}
              className="rounded-[10px] border border-[#e4e7ea] px-4 py-2 text-xs font-semibold text-[#3c424a] hover:border-[#f2b78f] disabled:opacity-50"
            >
              {invite.isRotating ? "Üretiliyor…" : "Yeni kod üret"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { AdminOverlay } from "@/components/admin/admin-ui";
import { useAddCoordinatorForm } from "@/hooks/use-admin-coordinators";
import { candidateMessage, isAssignable } from "@/lib/admin-coordinators";

const FIELD =
  "mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

export function AddCoordinatorDialog({ onClose }: { onClose: () => void }) {
  const form = useAddCoordinatorForm(onClose);
  const candidate = form.candidate;

  return (
    <AdminOverlay label="Koordinatör ekle" onClose={onClose}>
      <form
        aria-label="Koordinatör ekle"
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (form.canSave) form.save();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          Koordinatör ekle
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          Yeni biri için hesap açılır; kayıtlı bir mentor ya da girişimci ise
          rolü koordinatör olur. Mentorlar ve takımlar kendileri kayıt olur ve
          bu listede onay bekler.
        </p>

        <label className="mt-5 block text-[12.5px] font-medium text-[#676e78]">
          E-posta
          <input
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            className={FIELD}
          />
        </label>
        {form.needsName ? (
          <label className="mt-4 block text-[12.5px] font-medium text-[#676e78]">
            Ad soyad
            <input
              value={form.fullName}
              maxLength={255}
              onChange={(event) => form.setFullName(event.target.value)}
              className={FIELD}
            />
          </label>
        ) : null}

        <div aria-live="polite" className="mt-4 min-h-[20px] text-[13px]">
          {candidate ? (
            <p
              className={
                isAssignable(candidate) ? "text-[#1d3a5f]" : "text-[#d9464b]"
              }
            >
              {candidateMessage(candidate)}
            </p>
          ) : form.checkError ? (
            <p className="text-[#d9464b]">{form.checkError.message}</p>
          ) : form.checking ? (
            <p className="text-[#858c96]">Kontrol ediliyor…</p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={!form.canSave}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {form.saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </AdminOverlay>
  );
}

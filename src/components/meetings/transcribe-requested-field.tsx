"use client";

export function TranscribeRequestedField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e4e7ea] p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4 accent-[#e86f22]"
        />
        <span>
          <span className="block text-sm font-semibold text-[#22262b]">
            Toplantının transkriptinin çıkarılmasını istiyorum
          </span>
          <span className="mt-1 block text-xs leading-5 text-[#676e78]">
            İşaretlersen Meet linki Toplantı Asistanı listesine düşer; toplantı
            saatinde bot otomatik katılır.
          </span>
        </span>
      </label>
      {checked ? (
        <p
          role="status"
          className="mt-2 rounded-xl bg-[#fff9f5] px-3 py-2 text-xs leading-5 text-[#c85816]"
        >
          Toplantı sonrası Toplantı Asistanı&apos;ndan toplantı raporunu ve
          transkripti menteelerinize gönderebilirsiniz.
        </p>
      ) : null}
    </>
  );
}

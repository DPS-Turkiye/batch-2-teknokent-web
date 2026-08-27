import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-3 text-[11px] font-medium leading-tight"
      aria-label="Mentorluk ve Girişim Programları Platformu ana sayfa"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fdebdd] text-center text-[9px] font-black leading-[1.05] tracking-[-0.08em] text-[#e5701d]"
      >
        metual
      </span>
      <span className="max-w-44">
        ODTÜ Teknokent
        <br />
        Mentorluk Platformu
      </span>
    </Link>
  );
}

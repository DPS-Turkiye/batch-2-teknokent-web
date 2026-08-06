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
        className="grid size-9 shrink-0 place-items-center border border-zinc-300 bg-zinc-100 text-center text-[7px] font-semibold leading-[1.05] tracking-tight"
      >
        ODTÜ
        <br />
        TK
      </span>
      <span className="max-w-44">
        Mentorluk ve Girişim
        <br />
        Programları Platformu
      </span>
    </Link>
  );
}

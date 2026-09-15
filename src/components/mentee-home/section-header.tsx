import Image from "next/image";
import Link from "next/link";

export function SectionHeader({
  id,
  title,
  href,
  linkText,
  chevron = false,
}: {
  id: string;
  title: string;
  href?: string;
  linkText?: string;
  chevron?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2
        id={id}
        className="text-[15px] font-semibold leading-[22px] tracking-[-0.15px] text-[#22262b]"
      >
        {title}
      </h2>
      {href && linkText ? (
        chevron ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-medium leading-[19.5px] text-[#565e68] hover:bg-[#f3f4f6]"
          >
            {linkText}
            <Image
              src="/mentee-dashboard/home/chevron.svg"
              alt=""
              width={16}
              height={16}
              className="size-4"
            />
          </Link>
        ) : (
          <Link
            href={href}
            className="text-[12.5px] font-medium leading-[18px] text-[#c95c18] hover:underline"
          >
            {linkText} →
          </Link>
        )
      ) : null}
    </div>
  );
}

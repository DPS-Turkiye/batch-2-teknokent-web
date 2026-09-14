import Image from "next/image";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    title: "Mentor bul",
    subtitle: "Yeni ihtiyaç tanımla",
    href: "/mentor-request",
    icon: "qa-user-plus.svg",
  },
  {
    title: "Toplantı planla",
    subtitle: "Görüşme oluştur",
    href: "/calendar",
    icon: "qa-calendar-plus.svg",
  },
  {
    title: "Dosya yükle",
    subtitle: "Belge paylaş",
    href: "/startup/files",
    icon: "qa-upload.svg",
  },
  {
    title: "Görevlerim",
    subtitle: "Tümünü gör",
    href: "/startup/process",
    icon: "qa-checklist.svg",
  },
] as const;

export function QuickActions() {
  return (
    <section
      aria-label="Hızlı işlemler"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {QUICK_ACTIONS.map((action, index) => {
        const primary = index === 0;
        return (
          <Link
            key={action.title}
            href={action.href}
            className={`flex min-h-[126px] flex-col gap-3 rounded-[20px] p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${primary ? "bg-[#e86f22]/5" : "border-[0.5px] border-[#e4e7ea] bg-white"}`}
          >
            <span
              className={`grid size-10 place-items-center rounded-[10px] ${primary ? "bg-[#e86f22]" : "bg-[#fff4ec]/60"}`}
            >
              <Image
                src={`/mentee-dashboard/home/${action.icon}`}
                alt=""
                width={20}
                height={20}
                className="size-5"
              />
            </span>
            <span className="flex flex-col gap-0.5">
              <strong className="text-[13.5px] font-semibold leading-[20.25px] text-[#22262b]">
                {action.title}
              </strong>
              <small className="text-[11.5px] leading-[17.25px] text-[#a2aab4]">
                {action.subtitle}
              </small>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

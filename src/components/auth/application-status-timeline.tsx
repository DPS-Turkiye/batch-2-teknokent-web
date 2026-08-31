"use client";

import { Check } from "lucide-react";

import { UserAccountStatus } from "@/interfaces/session";

type TimelineEntry = {
  title: string;
  detail?: string;
  state: "done" | "current" | "pending";
};

export function buildApplicationTimeline(
  status: UserAccountStatus,
): TimelineEntry[] {
  const submitted: TimelineEntry[] = [
    { title: "Profil tamamlandı", state: "done" },
    { title: "Koordinatöre gönderildi", state: "done" },
  ];

  if (status === UserAccountStatus.Approved) {
    return [
      ...submitted,
      { title: "İncelendi", state: "done" },
      {
        title: "Startup aktif",
        detail:
          "Profilin onaylandı. Giriş yaparak çalışma alanını açabilirsin.",
        state: "current",
      },
    ];
  }

  if (status === UserAccountStatus.Rejected) {
    return [
      ...submitted,
      {
        title: "Başvuru onaylanmadı",
        detail:
          "Koordinatör başvurunu onaylamadı. Ayrıntı için info@metu.edu.tr adresine yazabilirsin.",
        state: "current",
      },
      { title: "Startup aktif olacak", state: "pending" },
    ];
  }

  return [
    ...submitted,
    {
      title: "İnceleniyor",
      detail:
        "Profilin koordinatörler tarafından incelenir. Genellikle 1-3 iş günü sürer.",
      state: "current",
    },
    { title: "Startup aktif olacak", state: "pending" },
  ];
}

export function ApplicationStatusTimeline({
  status,
}: {
  status: UserAccountStatus;
}) {
  const timeline = buildApplicationTimeline(status);

  return (
    <ol className="mt-4 space-y-0">
      {timeline.map((entry, index) => (
        <li key={entry.title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              aria-hidden
              className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                entry.state === "pending"
                  ? "border-[#e4e7ea] bg-white text-[#c9cdd2]"
                  : "border-[#e86f22] bg-white text-[#e86f22]"
              }`}
            >
              {entry.state === "done" ? (
                <Check className="size-3" />
              ) : (
                <span
                  className={`size-2 rounded-full ${entry.state === "current" ? "bg-[#e86f22]" : "bg-[#e4e7ea]"}`}
                />
              )}
            </span>
            {index < timeline.length - 1 ? (
              <span
                aria-hidden
                className={`w-0.5 flex-1 ${entry.state === "pending" ? "bg-[#e4e7ea]" : "bg-[#f2b78f]"}`}
              />
            ) : null}
          </div>
          <div className="pb-6">
            <p
              className={`text-sm font-medium ${entry.state === "pending" ? "text-[#a4aab2]" : "text-[#22262b]"}`}
            >
              {entry.title}
            </p>
            {entry.detail ? (
              <p className="mt-1 text-xs leading-relaxed text-[#676e78]">
                {entry.detail}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

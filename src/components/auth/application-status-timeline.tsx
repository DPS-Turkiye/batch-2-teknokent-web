"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAccountStatus } from "@/interfaces/session";
import tr from "@/messages/tr.json";

type TimelineEntry = {
  title: string;
  detail?: string;
  state: "done" | "current" | "pending";
};

export function buildApplicationTimeline(
  status: UserAccountStatus,
  copy: (key: keyof typeof tr.applicationTimeline) => string = (key) =>
    tr.applicationTimeline[key],
  student = false,
): TimelineEntry[] {
  // A student of an individual program waits for their account, not a startup.
  const active = student ? "studentActive" : "active";
  const willActivate = student ? "studentWillActivate" : "willActivate";
  const submitted: TimelineEntry[] = [
    { title: copy("completed"), state: "done" },
    { title: copy("sent"), state: "done" },
  ];

  if (status === UserAccountStatus.Approved) {
    return [
      ...submitted,
      { title: copy("reviewed"), state: "done" },
      {
        title: copy(active),
        detail: copy("approvedDetail"),
        state: "current",
      },
    ];
  }

  if (status === UserAccountStatus.Rejected) {
    return [
      ...submitted,
      {
        title: copy("rejected"),
        detail: copy("rejectedDetail"),
        state: "current",
      },
      { title: copy(willActivate), state: "pending" },
    ];
  }

  return [
    ...submitted,
    {
      title: copy("reviewing"),
      detail: copy("reviewingDetail"),
      state: "current",
    },
    { title: copy(willActivate), state: "pending" },
  ];
}

export function ApplicationStatusTimeline({
  status,
  student = false,
}: {
  status: UserAccountStatus;
  student?: boolean;
}) {
  const t = useTranslations("applicationTimeline");
  const timeline = buildApplicationTimeline(status, (key) => t(key), student);

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

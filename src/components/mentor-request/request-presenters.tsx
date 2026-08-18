import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import type { StartupContext } from "@/interfaces/startup";
import { MENTOR_REQUEST_STEPS } from "@/lib/const";
import { MentorRequestStep } from "@/types/mentor-request";

export function StepIndicator({ current }: { current: MentorRequestStep }) {
  return (
    <ol className="grid grid-cols-5 gap-2">
      {MENTOR_REQUEST_STEPS.map((label, index) => {
        const step = (index + 1) as MentorRequestStep;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 text-xs ${step <= current ? "text-[#555]" : "text-[#aaa]"}`}
          >
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full font-semibold ${step === current ? "bg-[#555] text-white" : "bg-[#f1f1f1]"}`}
            >
              {step}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PersonChoice({
  initials,
  name,
  role,
  selected,
  onClick,
}: {
  initials: string;
  name: string;
  role: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-16 items-center gap-3 rounded-lg border bg-white p-3 text-left ${selected ? "border-[#777]" : "border-[#e5e7eb]"}`}
    >
      <Avatar initials={initials} size="sm" />
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <strong className="block text-sm font-medium">{name}</strong>
          {selected ? <Badge>Ben</Badge> : null}
        </span>
        <span className="mt-0.5 block text-xs text-[#8a8a8a]">{role}</span>
      </span>
      {selected ? <span>✓</span> : null}
    </button>
  );
}

export function RequestSummary({
  area,
  person,
  startup,
  urgency,
}: {
  area: string;
  person: string;
  startup: StartupContext;
  urgency: string;
}) {
  return (
    <aside className="h-fit rounded-lg border border-[#e5e7eb] bg-white p-4">
      <h2 className="text-xs font-semibold uppercase text-[#888]">
        Talep Özeti
      </h2>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-xs text-[#aaa]">Talep sahibi</dt>
          <dd className="mt-1">{person}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Destek alanı</dt>
          <dd className="mt-1">{area}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Startup</dt>
          <dd className="mt-1">
            {startup.name} · {startup.stage || "Seviye belirtilmedi"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#aaa]">Aciliyet</dt>
          <dd className="mt-1">{urgency}</dd>
        </div>
      </dl>
    </aside>
  );
}

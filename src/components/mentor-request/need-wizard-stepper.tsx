import { useTranslations } from "next-intl";

import { MENTOR_REQUEST_NEED_STEPPER } from "@/lib/mentor-request-need";

export function NeedWizardStepper({
  current,
  onSelectStep,
}: {
  current: number;
  onSelectStep?: ((index: number) => void) | undefined;
}) {
  const t = useTranslations("mentorRequest.steps");
  return (
    <ol className="flex w-full" aria-label={t("label")}>
      {MENTOR_REQUEST_NEED_STEPPER.map((step, index) => {
        const active = index === current;
        const canGoBack = Boolean(onSelectStep) && index < current;
        const className = `flex w-full items-center justify-center gap-1 border-b pb-1 text-xs font-medium ${
          active
            ? "border-[#f97316] text-[#f97316]"
            : "border-[#e4e7ea] text-[#aeb4bc]"
        }`;
        const inner = (
          <>
            <span
              className={`grid size-6 place-items-center rounded-lg text-[10px] font-semibold text-white ${
                active ? "bg-[#f97316]" : "bg-[#aeb4bc]"
              }`}
            >
              {index + 1}
            </span>
            {t(step)}
          </>
        );
        return (
          <li key={step} className="min-w-0 flex-1">
            {canGoBack ? (
              <button
                type="button"
                className={className}
                onClick={() => onSelectStep?.(index)}
              >
                {inner}
              </button>
            ) : (
              <div className={className}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

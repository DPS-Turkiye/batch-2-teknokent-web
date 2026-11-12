import { useTranslations } from "next-intl";
import Image from "next/image";

export type StepPill = {
  key: string;
  label: string;
};

/**
 * The numbered step strip of a multi-step flow (program wizard, profile completion, mentor-profile wizard): the
 * current step is an ink pill, finished steps get a green check, later steps a muted number.
 */
export function StepPills({
  steps,
  currentIndex,
  label,
}: {
  steps: readonly StepPill[];
  currentIndex: number;
  label: string;
}) {
  const t = useTranslations("iaKit.stepPills");
  return (
    <ol aria-label={label} className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const current = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li
            key={step.key}
            aria-current={current ? "step" : undefined}
            className="flex items-center gap-2"
          >
            {index > 0 ? (
              <span aria-hidden className="h-px w-6 bg-border-default" />
            ) : null}
            <span
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 type-label ${
                current
                  ? "bg-background-inverse text-text-inverse"
                  : done
                    ? "text-text-primary"
                    : "text-text-secondary"
              }`}
            >
              <span
                aria-hidden
                className={`grid size-[22px] place-items-center rounded-full type-label-sm ${
                  current
                    ? "bg-background-surface text-text-primary"
                    : done
                      ? "bg-status-success-icon"
                      : "bg-background-muted text-text-secondary"
                }`}
              >
                {done ? (
                  <Image
                    alt=""
                    src="/ia/icons/check-inverse.svg"
                    width={12}
                    height={12}
                  />
                ) : (
                  index + 1
                )}
              </span>
              {step.label}
              <span className="sr-only">
                {done
                  ? t("done", { step: index + 1 })
                  : t("step", { step: index + 1 })}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

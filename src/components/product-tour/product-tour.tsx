"use client";

import { useTranslations } from "next-intl";

import { TourEndDialog } from "@/components/product-tour/tour-end-dialog";
import { TourSpotlight } from "@/components/product-tour/tour-spotlight";
import { TourStepCard } from "@/components/product-tour/tour-step-card";
import { TourWelcomeDialog } from "@/components/product-tour/tour-welcome-dialog";
import { useProductTour } from "@/hooks/use-product-tour";
import type { Workspace } from "@/interfaces/workspace";
import { TourAdvance, TourPhase } from "@/types/product-tour";

/**
 * The interactive onboarding tour of an ODTÜ workspace (Figma "07 Product Tour"): a welcome, steps that highlight
 * the real element to click on each page, and a closing dialog. Mounted once per workspace frame.
 */
export function ProductTour({ workspace }: { workspace: Workspace }) {
  const t = useTranslations("iaTour");
  const tour = useProductTour(workspace);
  if (tour.role === null || tour.phase === null) return null;
  const { role, step, target } = tour;

  return (
    // Every tour layer is ODTÜ red in the design, the academician's included.
    <div data-ia-accent="odtu">
      <p aria-live="polite" className="sr-only">
        {step
          ? t("card.announce", {
              current: tour.stepNumber,
              total: tour.stepCount,
              title: t(`steps.${step.key}.title`),
            })
          : ""}
      </p>
      {tour.phase === TourPhase.Welcome ? (
        <TourWelcomeDialog
          role={role}
          onStart={tour.start}
          onSkip={tour.skip}
        />
      ) : null}
      {step ? (
        <>
          <TourSpotlight
            box={target.box}
            radius={target.radius}
            viewport={target.viewport}
          />
          <TourStepCard
            stepKey={step.key}
            current={tour.stepNumber}
            total={tour.stepCount}
            box={target.box}
            viewport={target.viewport}
            missing={target.missing}
            showHint={tour.offersHint}
            showNext={tour.offersNext}
            showFinish={step.advance === TourAdvance.Finish}
            onNext={tour.next}
            onFinish={tour.finish}
            onSkip={tour.skip}
            onFocusTarget={tour.focusTarget}
          />
        </>
      ) : null}
      {tour.phase === TourPhase.Done ? (
        <TourEndDialog role={role} onClose={tour.close} onExit={tour.exit} />
      ) : null}
    </div>
  );
}

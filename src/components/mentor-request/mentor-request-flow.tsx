"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { MentorPickStep } from "@/components/mentor-request/mentor-pick-step";
import { NeedGoalStep } from "@/components/mentor-request/need-goal-step";
import { NeedSituationStep } from "@/components/mentor-request/need-situation-step";
import { NeedSummaryStep } from "@/components/mentor-request/need-summary-step";
import { NeedTopicStep } from "@/components/mentor-request/need-topic-step";
import { useMentorRequest } from "@/hooks/use-mentor-request";
import type { MentorProfile } from "@/interfaces/mentor";
import type { StartupContext } from "@/interfaces/startup";
import {
  canContinueGoalStep,
  canContinueNeedStep,
  canContinueSituationStep,
  DEFAULT_NEED_GOAL_IDS,
  DEFAULT_NEED_SITUATION_ID,
  MENTOR_REQUEST_NEED_TOPICS,
  expertiseForNeed,
  messageForNeedGoals,
  needTitleForSummary,
  readNeedDraft,
  startupContextLine,
  summaryForNeed,
  subscribeNeedDraft,
  supportAreaForNeedTopic,
  toggleNeedGoal,
  writeNeedDraft,
  type MentorRequestNeedGoalId,
  type MentorRequestNeedSituationId,
  type MentorRequestNeedTopicId,
} from "@/lib/mentor-request-need";
import {
  FORMAT_BY_LABEL,
  MEETING_MODE_BY_LABEL,
  URGENCY_BY_LABEL,
} from "@/lib/mentor-request-options";
import {
  DEFAULT_MENTOR_PICK_FILTER,
  mentorsForPickFilter,
  type MentorPickFilterId,
} from "@/lib/mentor-request-pick";
import { MentorRequestStep } from "@/types/mentor-request";

export function MentorRequestFlow({
  mentors: initialMentors,
  mentorLoadError,
  startup,
  startupLoadError,
}: {
  mentors: MentorProfile[];
  mentorLoadError?: string;
  startup: StartupContext;
  startupLoadError?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const requestedStep = Number(params.get("step"));
  const excludedMentor = params.get("exclude");
  const {
    baseMentors,
    isMatching,
    matchingError,
    recommendedMentors,
    prepareRecommendations,
  } = useMentorRequest(initialMentors, excludedMentor);
  const [step, setStep] = useState<MentorRequestStep>(() => {
    if (
      Number.isInteger(requestedStep) &&
      requestedStep >= MentorRequestStep.Need &&
      requestedStep <= MentorRequestStep.MentorSelect
    ) {
      return requestedStep as MentorRequestStep;
    }
    return MentorRequestStep.Need;
  });
  const storedNeedDraft = useSyncExternalStore(
    subscribeNeedDraft,
    readNeedDraft,
    () => null,
  );
  const [localTopicId, setLocalTopicId] =
    useState<MentorRequestNeedTopicId | null>(null);
  const [localOtherSummary, setLocalOtherSummary] = useState<string | null>(
    null,
  );
  const [localSituationId, setLocalSituationId] =
    useState<MentorRequestNeedSituationId | null>(null);
  const [localNoneSummary, setLocalNoneSummary] = useState<string | null>(null);
  const [localGoalIds, setLocalGoalIds] = useState<
    MentorRequestNeedGoalId[] | null
  >(null);
  const [localGoalNote, setLocalGoalNote] = useState<string | null>(null);
  const topicId =
    localTopicId ??
    storedNeedDraft?.topicId ??
    MENTOR_REQUEST_NEED_TOPICS[0].id;
  const otherSummary = localOtherSummary ?? storedNeedDraft?.otherSummary ?? "";
  const situationId =
    localSituationId ??
    storedNeedDraft?.situationId ??
    DEFAULT_NEED_SITUATION_ID;
  const noneSummary = localNoneSummary ?? storedNeedDraft?.noneSummary ?? "";
  const goalIds =
    localGoalIds ?? storedNeedDraft?.goalIds ?? DEFAULT_NEED_GOAL_IDS;
  const goalNote = localGoalNote ?? storedNeedDraft?.goalNote ?? "";
  const area = supportAreaForNeedTopic(topicId);
  const summary = summaryForNeed({
    topicId,
    otherSummary,
    situationId,
    noneSummary,
  });
  const [mentorId, setMentorId] = useState(() => initialMentors[0]?.id ?? "");
  const [pickingMentor, setPickingMentor] = useState(false);
  const [mentorPickFilter, setMentorPickFilter] = useState<MentorPickFilterId>(
    DEFAULT_MENTOR_PICK_FILTER,
  );
  const isNeedWizardStep =
    !pickingMentor &&
    (step === MentorRequestStep.Need ||
      step === MentorRequestStep.Expectation ||
      step === MentorRequestStep.Info ||
      step === MentorRequestStep.MentorSelect);
  const listedMentors = mentorsForPickFilter(
    mentorPickFilter,
    recommendedMentors,
    baseMentors,
  );
  const excludedMentorId = excludedMentor
    ? initialMentors.find((item) => item.fullName === excludedMentor)?.id
    : undefined;

  function selectNeedTopic(id: MentorRequestNeedTopicId) {
    setLocalTopicId(id);
  }

  function updateOtherSummary(value: string) {
    setLocalOtherSummary(value);
  }

  function selectNeedSituation(id: MentorRequestNeedSituationId) {
    setLocalSituationId(id);
  }

  function updateNoneSummary(value: string) {
    setLocalNoneSummary(value);
  }

  function toggleGoal(id: MentorRequestNeedGoalId) {
    setLocalGoalIds(toggleNeedGoal(goalIds, id));
  }

  function updateGoalNote(value: string) {
    setLocalGoalNote(value);
  }

  function goToNeedWizardStep(index: number) {
    setPickingMentor(false);
    if (index === 0) setStep(MentorRequestStep.Need);
    if (index === 1) setStep(MentorRequestStep.Expectation);
    if (index === 2) setStep(MentorRequestStep.Info);
    if (index === 3) setStep(MentorRequestStep.MentorSelect);
  }

  function handleSaveNeedDraft() {
    writeNeedDraft({
      topicId,
      otherSummary,
      situationId,
      noneSummary,
      goalIds,
      goalNote,
    });
    router.push("/mentorships");
  }

  async function advanceStep() {
    if (step !== MentorRequestStep.MentorSelect) {
      setStep((value) => (value + 1) as MentorRequestStep);
      return;
    }

    try {
      const result = await prepareRecommendations({
        supportArea: area,
        summary,
        urgency: URGENCY_BY_LABEL["Bu hafta"],
        mentorshipFormat: FORMAT_BY_LABEL["Tek görüşme"],
        meetingMode: MEETING_MODE_BY_LABEL.Online,
        startup,
        excludedMentorId,
      });
      setMentorId(result.mentors[0]?.id ?? "");
      setMentorPickFilter(DEFAULT_MENTOR_PICK_FILTER);
      setPickingMentor(true);
    } catch {
      setMentorPickFilter(DEFAULT_MENTOR_PICK_FILTER);
      setPickingMentor(true);
    }
  }

  function goBack() {
    if (pickingMentor) {
      setPickingMentor(false);
      return;
    }
    setStep((value) => (value - 1) as MentorRequestStep);
  }

  return (
    <AppShell
      backHref={step === MentorRequestStep.Need ? "/mentorships" : undefined}
    >
      <div className="mx-auto w-full max-w-[1216px] px-4 py-6 sm:px-8">
        {mentorLoadError || startupLoadError ? (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {[mentorLoadError, startupLoadError].filter(Boolean).join(" ")}
          </p>
        ) : null}

        <div className="mt-8">
          {step === MentorRequestStep.Need ? (
            <NeedTopicStep
              topicId={topicId}
              otherSummary={otherSummary}
              onSelectTopic={selectNeedTopic}
              onOtherSummaryChange={updateOtherSummary}
            />
          ) : null}

          {step === MentorRequestStep.Expectation ? (
            <NeedSituationStep
              situationId={situationId}
              noneSummary={noneSummary}
              onSelectSituation={selectNeedSituation}
              onNoneSummaryChange={updateNoneSummary}
              onSelectStep={goToNeedWizardStep}
            />
          ) : null}

          {step === MentorRequestStep.Info ? (
            <NeedGoalStep
              goalIds={goalIds}
              goalNote={goalNote}
              onToggleGoal={toggleGoal}
              onGoalNoteChange={updateGoalNote}
              onSelectStep={goToNeedWizardStep}
            />
          ) : null}

          {step === MentorRequestStep.MentorSelect && pickingMentor ? (
            <MentorPickStep
              filter={mentorPickFilter}
              listedMentors={listedMentors}
              matchingError={matchingError}
              isMatching={isMatching}
              mentorId={mentorId}
              onFilterChange={setMentorPickFilter}
            />
          ) : null}

          {step === MentorRequestStep.MentorSelect && !pickingMentor ? (
            <NeedSummaryStep
              startupLine={startupContextLine([
                startup.name,
                startup.stage,
                startup.sector,
              ])}
              needTitle={needTitleForSummary(topicId, otherSummary)}
              problem={summary}
              outcome={messageForNeedGoals(goalIds, goalNote)}
              expertise={expertiseForNeed(situationId)}
              onEditNeed={() => goToNeedWizardStep(0)}
              onEditProblem={() => goToNeedWizardStep(1)}
              onEditOutcome={() => goToNeedWizardStep(2)}
              onSelectStep={goToNeedWizardStep}
            />
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[#eee] pt-5">
          {isNeedWizardStep ? (
            <SecondaryButton onClick={handleSaveNeedDraft}>
              Taslak Olarak Kaydet
            </SecondaryButton>
          ) : (
            <SecondaryButton onClick={goBack}>Geri</SecondaryButton>
          )}
          {pickingMentor ? null : (
            <PrimaryButton
              className={isNeedWizardStep ? "min-h-11 min-w-[170px]" : ""}
              disabled={
                (step === MentorRequestStep.MentorSelect && isMatching) ||
                (step === MentorRequestStep.Need &&
                  !canContinueNeedStep(topicId, otherSummary)) ||
                (step === MentorRequestStep.Expectation &&
                  !canContinueSituationStep(situationId, noneSummary)) ||
                (step === MentorRequestStep.Info &&
                  !canContinueGoalStep(goalIds))
              }
              onClick={() => void advanceStep()}
            >
              {step === MentorRequestStep.MentorSelect && isMatching
                ? "Öneriler hazırlanıyor…"
                : "Devam et"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </AppShell>
  );
}

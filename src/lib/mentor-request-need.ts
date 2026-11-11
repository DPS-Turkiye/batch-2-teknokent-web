import type { useTranslations } from "next-intl";

export const MENTOR_REQUEST_NEED_STEPPER = [
  "topic",
  "situation",
  "goal",
  "summary",
] as const;

export const MENTOR_REQUEST_NEED_DRAFT_KEY = "mentor-request-need-draft";

/** Who a preset choice is for: startup teams, students of an individual program (İŞKUR), or both. */
export enum NeedAudience {
  Startup = "STARTUP",
  Student = "STUDENT",
  Any = "ANY",
}

export const MENTOR_REQUEST_NEED_TOPICS = [
  {
    id: "product",
    audience: NeedAudience.Startup,
    title: "Ürün",
    description:
      "Ne yapacağımızı veya nasıl geliştireceğimizi netleştiremiyoruz.",
    supportArea: "Ürün ve ürün yönetimi",
  },
  {
    id: "customer",
    audience: NeedAudience.Startup,
    title: "Müşteri",
    description: "Doğru kullanıcıya ulaşıp ulaşmadığımızdan emin değiliz.",
    supportArea: "Kullanıcı araştırması ve tasarım",
  },
  {
    id: "growth",
    audience: NeedAudience.Startup,
    title: "Büyüme & Satış",
    description: "Kullanıcı veya müşteri kazanmakta zorlanıyoruz.",
    supportArea: "Satış ve pazarlama",
  },
  {
    id: "finance",
    audience: NeedAudience.Startup,
    title: "İş Modeli & Finans",
    description:
      "Nasıl para kazanacağımızı veya finansal planı netleştiremiyoruz.",
    supportArea: "İş modeli ve strateji",
  },
  {
    id: "investment",
    audience: NeedAudience.Startup,
    title: "Yatırım",
    description: "Yatırıma nasıl hazırlanacağımızı bilmiyoruz.",
    supportArea: "Finans ve yatırım",
  },
  {
    id: "team",
    audience: NeedAudience.Startup,
    title: "Ekip & Operasyon",
    description: "Ekip, rol veya süreçlerde tıkanıyoruz.",
    supportArea: "Ekip ve organizasyon",
  },
  {
    id: "career",
    audience: NeedAudience.Student,
    title: "Kariyer planlama",
    description: "Hangi alanda ilerleyeceğime karar veremiyorum.",
    supportArea: "Kariyer planlama",
  },
  {
    id: "internship",
    audience: NeedAudience.Student,
    title: "Staj",
    description: "Staj bulmak ya da başvurmak için desteğe ihtiyacım var.",
    supportArea: "Staj",
  },
  {
    id: "cv",
    audience: NeedAudience.Student,
    title: "CV & LinkedIn",
    description: "CV’mi ya da LinkedIn profilimi güçlendirmek istiyorum.",
    supportArea: "CV & LinkedIn",
  },
  {
    id: "interview",
    audience: NeedAudience.Student,
    title: "Mülakat",
    description: "Bir mülakata hazırlanmak istiyorum.",
    supportArea: "Mülakat",
  },
  {
    id: "job",
    audience: NeedAudience.Student,
    title: "İş arama & ilk iş",
    description: "İş aramaya ya da ilk işime nereden başlayacağımı bilmiyorum.",
    supportArea: "İş arama & ilk iş",
  },
  {
    id: "courses",
    audience: NeedAudience.Student,
    title: "Dersler",
    description: "Derslerde ya da çalışma düzenimde zorlanıyorum.",
    supportArea: "Dersler",
  },
  {
    id: "erasmus",
    audience: NeedAudience.Student,
    title: "Erasmus & yurt dışı",
    description:
      "Erasmus’a ya da yurt dışında bir programa başvurmak istiyorum.",
    supportArea: "Erasmus & yurt dışı",
  },
  {
    id: "project",
    audience: NeedAudience.Student,
    title: "Proje & girişimcilik",
    description: "Bir proje ya da girişim fikri üzerinde çalışıyorum.",
    supportArea: "Proje & girişimcilik",
  },
  {
    id: "other",
    audience: NeedAudience.Any,
    title: "Başka bir konu",
    description: "Bunlara uymuyorsa kısa şekilde kendin anlatabilirsin.",
    supportArea: "Diğer",
  },
] as const;

export type MentorRequestNeedTopicId =
  (typeof MENTOR_REQUEST_NEED_TOPICS)[number]["id"];

export const MENTOR_REQUEST_NEED_SITUATIONS = [
  {
    id: "value",
    audience: NeedAudience.Startup,
    title: "Kullanıcı ürünün değerini anlamıyor",
    description:
      "Ürünü kullanmaya başlıyor ama neden devam etmesi gerektiği net değil.",
  },
  {
    id: "onboarding",
    audience: NeedAudience.Startup,
    title: "Onboarding sırasında kullanıcı kaybediyoruz",
    description: "Kullanıcıların önemli bir kısmı ilk adımlarda bırakıyor.",
  },
  {
    id: "focus",
    audience: NeedAudience.Startup,
    title: "Hangi özelliğe odaklanacağımızı bilmiyoruz",
    description: "Birçok fikir var ama önceliklendiremiyoruz.",
  },
  {
    id: "problem",
    audience: NeedAudience.Startup,
    title: "Doğru problemi çözüp çözmediğimizden emin değiliz",
    description: "Kullanıcı ihtiyacını yeterince doğrulayamadık.",
  },
  {
    id: "positioning",
    audience: NeedAudience.Startup,
    title: "Konumlandırmamız net değil",
    description:
      "Ürünü nasıl anlatacağımızı ve rakiplerden nasıl ayrışacağımızı bilmiyoruz.",
  },
  {
    id: "start",
    audience: NeedAudience.Student,
    title: "Nereden başlayacağımı bilmiyorum",
    description:
      "Konuyu yeni düşünmeye başladım, bir yol haritasına ihtiyacım var.",
  },
  {
    id: "decide",
    audience: NeedAudience.Student,
    title: "Bir karar vermem gerekiyor",
    description:
      "Birkaç seçenek arasında kaldım, hangisinin bana uyduğunu bilmiyorum.",
  },
  {
    id: "apply",
    audience: NeedAudience.Student,
    title: "Bir başvuruya hazırlanıyorum",
    description: "Yakında bir staj, iş ya da program başvurum var.",
  },
  {
    id: "review",
    audience: NeedAudience.Student,
    title: "Yaptığım bir çalışmaya geri bildirim istiyorum",
    description:
      "CV’m, projem ya da başvuru metnim için görüş almak istiyorum.",
  },
  {
    id: "none",
    audience: NeedAudience.Any,
    title: "Bunlardan hiçbiri",
    description: "Kısaca kendim anlatacağım.",
  },
] as const;

export type MentorRequestNeedSituationId =
  (typeof MENTOR_REQUEST_NEED_SITUATIONS)[number]["id"];

export const DEFAULT_NEED_SITUATION_ID: MentorRequestNeedSituationId =
  "onboarding";

export const MENTOR_REQUEST_NEED_GOALS = [
  { id: "decision", label: "Bir karar vermek" },
  { id: "next-steps", label: "Bir sonraki adımları belirlemek" },
  { id: "evaluate", label: "Mevcut yaklaşımı değerlendirmek" },
  { id: "options", label: "Yeni seçenekler görmek" },
  { id: "roadmap", label: "Yol haritası oluşturmak" },
  { id: "feedback", label: "Bir çalışmaya feedback almak" },
] as const;

export type MentorRequestNeedGoalId =
  (typeof MENTOR_REQUEST_NEED_GOALS)[number]["id"];

export const DEFAULT_NEED_GOAL_IDS: MentorRequestNeedGoalId[] = ["next-steps"];
export const MAX_NEED_GOALS = 2;

export type MentorRequestNeedDraft = {
  topicId: MentorRequestNeedTopicId;
  otherSummary: string;
  situationId?: MentorRequestNeedSituationId | undefined;
  noneSummary?: string | undefined;
  goalIds?: MentorRequestNeedGoalId[] | undefined;
  goalNote?: string | undefined;
};

const TOPIC_IDS = new Set<string>(
  MENTOR_REQUEST_NEED_TOPICS.map((topic) => topic.id),
);

const SITUATION_IDS = new Set<string>(
  MENTOR_REQUEST_NEED_SITUATIONS.map((situation) => situation.id),
);

const GOAL_IDS = new Set<string>(
  MENTOR_REQUEST_NEED_GOALS.map((goal) => goal.id),
);

export function isNeedTopicId(
  value: string,
): value is MentorRequestNeedTopicId {
  return TOPIC_IDS.has(value);
}

export function isNeedSituationId(
  value: string,
): value is MentorRequestNeedSituationId {
  return SITUATION_IDS.has(value);
}

export function isNeedGoalId(value: string): value is MentorRequestNeedGoalId {
  return GOAL_IDS.has(value);
}

/** Texts of the preset choices: the page shows them translated, the request saves the Turkish ones. */
export type NeedLabels = {
  topicTitle: (id: MentorRequestNeedTopicId) => string;
  topicDescription: (id: MentorRequestNeedTopicId) => string;
  situationDescription: (id: MentorRequestNeedSituationId) => string;
  goalLabel: (id: MentorRequestNeedGoalId) => string;
};

const SAVED_NEED_LABELS: NeedLabels = {
  topicTitle: (id) => needTopicById(id).title,
  topicDescription: (id) => needTopicById(id).description,
  situationDescription: (id) => needSituationById(id).description,
  goalLabel: (id) => needGoalById(id).label,
};

export function needLabels(
  t: ReturnType<typeof useTranslations<"mentorRequest">>,
): NeedLabels {
  return {
    topicTitle: (id) => t(`topics.${id}.title`),
    topicDescription: (id) => t(`topics.${id}.description`),
    situationDescription: (id) => t(`situations.${id}.description`),
    goalLabel: (id) => t(`goals.${id}`),
  };
}

export function needTopicById(topicId: string) {
  return (
    MENTOR_REQUEST_NEED_TOPICS.find((topic) => topic.id === topicId) ??
    MENTOR_REQUEST_NEED_TOPICS[0]
  );
}

export function supportAreaForNeedTopic(topicId: string) {
  return needTopicById(topicId).supportArea;
}

export function summaryForNeedTopic(
  topicId: string,
  otherSummary: string,
  labels = SAVED_NEED_LABELS,
) {
  const topic = needTopicById(topicId);
  return topic.id === "other"
    ? otherSummary.trim()
    : labels.topicDescription(topic.id);
}

export function canContinueNeedStep(topicId: string, otherSummary: string) {
  if (!isNeedTopicId(topicId)) return false;
  if (topicId === "other") return otherSummary.trim().length > 0;
  return true;
}

export function needSituationById(situationId: string) {
  return (
    MENTOR_REQUEST_NEED_SITUATIONS.find(
      (situation) => situation.id === situationId,
    ) ?? MENTOR_REQUEST_NEED_SITUATIONS[1]
  );
}

export function summaryForNeedSituation(
  situationId: string,
  noneSummary: string,
  labels = SAVED_NEED_LABELS,
) {
  const situation = needSituationById(situationId);
  return situation.id === "none"
    ? noneSummary.trim()
    : labels.situationDescription(situation.id);
}

export function summaryForNeed(
  input: {
    topicId: string;
    otherSummary: string;
    situationId: string;
    noneSummary: string;
  },
  labels = SAVED_NEED_LABELS,
) {
  if (isNeedSituationId(input.situationId)) {
    return summaryForNeedSituation(
      input.situationId,
      input.noneSummary,
      labels,
    );
  }
  return summaryForNeedTopic(input.topicId, input.otherSummary, labels);
}

export function canContinueSituationStep(
  situationId: string,
  noneSummary: string,
) {
  if (!isNeedSituationId(situationId)) return false;
  if (situationId === "none") return noneSummary.trim().length > 0;
  return true;
}

export function needGoalById(goalId: string) {
  return (
    MENTOR_REQUEST_NEED_GOALS.find((goal) => goal.id === goalId) ??
    MENTOR_REQUEST_NEED_GOALS[1]
  );
}

export function toggleNeedGoal(
  selected: readonly string[],
  id: MentorRequestNeedGoalId,
): MentorRequestNeedGoalId[] {
  const current = selected.filter((item): item is MentorRequestNeedGoalId =>
    isNeedGoalId(item),
  );
  if (current.includes(id)) return current.filter((item) => item !== id);
  if (current.length >= MAX_NEED_GOALS) return current;
  return [...current, id];
}

export function canContinueGoalStep(goalIds: readonly string[]) {
  const valid = goalIds.filter((id) => isNeedGoalId(id));
  return valid.length >= 1 && valid.length <= MAX_NEED_GOALS;
}

export function messageForNeedGoals(
  goalIds: readonly string[],
  goalNote: string,
  labels = SAVED_NEED_LABELS,
) {
  const goals = goalIds
    .filter((id) => isNeedGoalId(id))
    .map((id) => labels.goalLabel(id));
  const note = goalNote.trim();
  return [goals.join(", "), note].filter(Boolean).join("\n");
}

const EXPERTISE_BY_SITUATION: Record<MentorRequestNeedSituationId, string[]> = {
  value: ["Value Proposition", "UX Strategy", "User Research"],
  onboarding: [
    "Onboarding",
    "UX Strategy",
    "User Research",
    "Value Proposition",
  ],
  focus: ["Product Strategy", "Prioritization", "UX Strategy"],
  problem: ["User Research", "Problem Discovery", "UX Strategy"],
  positioning: ["Positioning", "Value Proposition", "Messaging"],
  start: ["Kariyer planlama", "İş arama & ilk iş"],
  decide: ["Kariyer planlama", "Dersler"],
  apply: ["Staj", "Mülakat", "CV & LinkedIn", "Erasmus & yurt dışı"],
  review: ["CV & LinkedIn", "Proje & girişimcilik"],
  none: ["Strategy", "Mentorship"],
};

export function expertiseForNeed(situationId: string) {
  if (!isNeedSituationId(situationId)) {
    return EXPERTISE_BY_SITUATION.onboarding;
  }
  return EXPERTISE_BY_SITUATION[situationId];
}

export function needTitleForSummary(
  topicId: string,
  otherSummary: string,
  labels = SAVED_NEED_LABELS,
) {
  const topic = needTopicById(topicId);
  if (topic.id === "other") {
    return otherSummary.trim() || labels.topicTitle(topic.id);
  }
  return labels.topicTitle(topic.id);
}

export function startupContextLine(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
}

export function parseNeedDraft(
  raw: string | null,
): MentorRequestNeedDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      topicId?: unknown;
      otherSummary?: unknown;
      situationId?: unknown;
      noneSummary?: unknown;
      goalIds?: unknown;
      goalNote?: unknown;
    };
    if (typeof parsed.topicId !== "string" || !isNeedTopicId(parsed.topicId)) {
      return null;
    }
    return {
      topicId: parsed.topicId,
      otherSummary:
        typeof parsed.otherSummary === "string" ? parsed.otherSummary : "",
      situationId:
        typeof parsed.situationId === "string" &&
        isNeedSituationId(parsed.situationId)
          ? parsed.situationId
          : undefined,
      noneSummary:
        typeof parsed.noneSummary === "string" ? parsed.noneSummary : "",
      goalIds: Array.isArray(parsed.goalIds)
        ? parsed.goalIds.filter(
            (id): id is MentorRequestNeedGoalId =>
              typeof id === "string" && isNeedGoalId(id),
          )
        : undefined,
      goalNote: typeof parsed.goalNote === "string" ? parsed.goalNote : "",
    };
  } catch {
    return null;
  }
}

let cachedNeedDraftRaw: string | null | undefined;
let cachedNeedDraft: MentorRequestNeedDraft | null = null;

export function readNeedDraft(): MentorRequestNeedDraft | null {
  try {
    const raw = sessionStorage.getItem(MENTOR_REQUEST_NEED_DRAFT_KEY);
    if (raw === cachedNeedDraftRaw) return cachedNeedDraft;
    cachedNeedDraftRaw = raw;
    cachedNeedDraft = parseNeedDraft(raw);
    return cachedNeedDraft;
  } catch {
    return null;
  }
}

export function writeNeedDraft(draft: MentorRequestNeedDraft) {
  try {
    const raw = JSON.stringify(draft);
    sessionStorage.setItem(MENTOR_REQUEST_NEED_DRAFT_KEY, raw);
    cachedNeedDraftRaw = raw;
    cachedNeedDraft = draft;
  } catch {
    // Private mode / blocked storage should not block leaving the step.
  }
}

export function subscribeNeedDraft(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function forAudience<T extends { audience: NeedAudience }>(
  items: readonly T[],
  student: boolean,
) {
  const own = student ? NeedAudience.Student : NeedAudience.Startup;
  return items.filter(
    (item) => item.audience === own || item.audience === NeedAudience.Any,
  );
}

function requiredHead<T>(items: readonly T[]): T {
  const item = items[0];
  if (item === undefined) throw new Error("Choice list is empty");
  return item;
}

/** The topics and situations a mentee is offered: students of an individual program get their own. */
export function needChoices(student: boolean) {
  const topics = forAudience(MENTOR_REQUEST_NEED_TOPICS, student);
  const situations = forAudience(MENTOR_REQUEST_NEED_SITUATIONS, student);
  return {
    topics,
    situations,
    defaultTopicId: requiredHead(topics).id,
    defaultSituationId: student
      ? requiredHead(situations).id
      : DEFAULT_NEED_SITUATION_ID,
  };
}

export type NeedTopicChoice = ReturnType<typeof needChoices>["topics"][number];
export type NeedSituationChoice = ReturnType<
  typeof needChoices
>["situations"][number];

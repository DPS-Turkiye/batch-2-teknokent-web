export enum MentorOnboardingStep {
  Intro = 1,
  Expertise = 2,
  Compatibility = 3,
  Preferences = 4,
}

export const MENTOR_STEP_LABELS: Record<MentorOnboardingStep, string> = {
  [MentorOnboardingStep.Intro]: "Sizi tanıyalım",
  [MentorOnboardingStep.Expertise]: "Uzmanlıklarınız",
  [MentorOnboardingStep.Compatibility]: "Mentorluk uyumu",
  [MentorOnboardingStep.Preferences]: "Tercihleriniz",
};

export const MENTOR_STEP_ORDER: MentorOnboardingStep[] = [
  MentorOnboardingStep.Intro,
  MentorOnboardingStep.Expertise,
  MentorOnboardingStep.Compatibility,
  MentorOnboardingStep.Preferences,
];

/** Step 1 runs upload -> parsing -> review before the wizard moves on. */
export enum IntroPhase {
  Upload = "upload",
  Parsing = "parsing",
  Review = "review",
}

export const CV_PARSE_MS = 1600;

export interface ParsedExperience {
  title: string;
  organization: string;
}

export interface ParsedProfile {
  fullName: string;
  title: string;
  company: string;
  totalExperience: string;
  history: ParsedExperience[];
  inferredAreas: string[];
}

/**
 * Stand-in for what the CV parser will return. The mentor parsing endpoint is
 * another developer's work, so step 1 shows this shape after a simulated
 * parse rather than calling anything.
 */
export const PLACEHOLDER_PARSED_PROFILE: ParsedProfile = {
  fullName: "",
  title: "",
  company: "",
  totalExperience: "",
  history: [],
  inferredAreas: [],
};

export const MAX_EXPERTISE_AREAS = 6;

/** Areas the design shows as "coming from the CV". */
export const SUGGESTED_EXPERTISE = [
  "Finans",
  "Yatırım Alma",
  "Finansal Modelleme",
  "Strateji",
] as const;

/** The "you might also want to add these" pool. */
export const ADDITIONAL_EXPERTISE = [
  "Birim Ekonomisi",
  "Fiyatlandırma",
  "Nakit Akışı",
  "Yatırım Hazırlığı",
  "İş Modeli",
  "Bütçeleme",
] as const;

export const SUPPORT_TOPICS = [
  "Fiyatlandırma stratejisi",
  "Yatırıma hazırlık",
  "Finansal planlama",
  "MVP kapsamı",
  "İş modeli geliştirme",
  "Kullanıcı doğrulama",
  "Büyüme stratejisi",
  "Pitch geliştirme",
  "Müşteri kazanımı",
  "Önceliklendirme",
  "KPI ve metrikler",
  "Teknik mimari",
] as const;

export interface ProgramStage {
  id: string;
  label: string;
  description: string;
}

export const PROGRAM_STAGES: ProgramStage[] = [
  {
    id: "explore",
    label: "Explore",
    description: "Problem keşfi ve doğrulama",
  },
  {
    id: "build",
    label: "Build",
    description: "Ürün, MVP ve iş modeli geliştirme",
  },
  {
    id: "grow",
    label: "Grow",
    description: "Büyüme, satış ve yatırım hazırlığı",
  },
];

export const MENTORING_STYLES = [
  "Stratejik yönlendirme",
  "Uygulamalı geri bildirim",
  "Problem çözme",
  "Değerlendirme ve kritik",
  "Süreç takibi",
  "Sektör deneyimi paylaşımı",
] as const;

export const WORKING_STAGES = [
  "Fikir",
  "Prototip",
  "MVP",
  "İlk kullanıcılar",
  "Büyüme",
] as const;

export const MENTOR_SECTORS = [
  "SaaS",
  "Yapay Zekâ",
  "Fintech",
  "Sağlık Teknolojileri",
  "Marketplace",
  "Oyun",
  "Donanım",
  "Sürdürülebilirlik",
] as const;

export const CAPACITY_OPTIONS = ["1", "2", "3", "4+"] as const;

export interface MentorOnboardingDraft {
  cv: { name: string; size: number } | null;
  profile: ParsedProfile;
  expertise: string[];
  supportTopics: string[];
  programStages: string[];
  mentoringStyles: string[];
  workingStages: string[];
  sectors: string[];
  capacity: string;
}

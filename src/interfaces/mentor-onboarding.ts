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

export enum IntroPhase {
  Upload = "upload",
  Parsing = "parsing",
  Review = "review",
}

export const CV_PARSE_MS = 1600;

export interface ParsedExperience {
  title: string;
  organization: string;
  period?: string;
  summary?: string;
}

export interface ParsedProfile {
  fullName: string;
  title: string;
  company: string;
  totalExperience: string;
  history: ParsedExperience[];
  inferredAreas: string[];
}

export const PLACEHOLDER_PARSED_PROFILE: ParsedProfile = {
  fullName: "",
  title: "",
  company: "",
  totalExperience: "",
  history: [],
  inferredAreas: [],
};

export const MAX_EXPERTISE_AREAS = 6;

export const SUGGESTED_EXPERTISE = [
  "Finans",
  "Yatırım Alma",
  "Finansal Modelleme",
  "Strateji",
] as const;

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
    label: "Keşif",
    description: "Problem keşfi ve doğrulama",
  },
  {
    id: "build",
    label: "Geliştirme",
    description: "Ürün, MVP ve iş modeli geliştirme",
  },
  {
    id: "grow",
    label: "Büyüme",
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
  cv: { name: string; size: number; file?: File } | null;
  profile: ParsedProfile;
  expertise: string[];
  supportTopics: string[];
  programStages: string[];
  mentoringStyles: string[];
  workingStages: string[];
  sectors: string[];
  capacity: string;
}

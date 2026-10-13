import { LandingMock } from "@/types/landing";

export const LANDING_TITLE = "menton · ODTÜ Teknokent";

export const LANDING_PHOTOS = {
  nihan: "/landing/nihan-ozturk.jpg",
  cagri: "/landing/cagri-yilmaz.jpg",
  deniz: "/landing/deniz-aksoy.jpg",
} as const;

// Structure only below: the words are under "landing" in messages/{tr,en}.json, keyed by these ids.

export const LANDING_NAV_LINKS = [
  { key: "how", href: "#nasil" },
  { key: "announcements", href: "#duyurular" },
  { key: "compare", href: "#karsilastirma" },
  { key: "faq", href: "#sss" },
] as const;

export const LANDING_ANNOUNCEMENTS = [
  { key: "application", tone: "or", mock: LandingMock.Calendar },
  { key: "training", tone: "bl", mock: LandingMock.Training },
  { key: "support", tone: null, mock: LandingMock.Checklist },
] as const;

/** Whose screen the "Nasıl işler?" stage shows: steps 2 and 3 are the mentor's, 1 and 4 the startup's. */
export const LANDING_MENTOR_STEPS = new Set([1, 2]);

/** How long each "Nasıl işler?" step stays on screen while it plays. */
export const LANDING_STEP_MS = 3700;

export const LANDING_TOPIC_CHIPS = [
  { key: "productUx", selected: true },
  { key: "finance", selected: false },
  { key: "valueProposition", selected: true },
  { key: "mvp", selected: true },
  { key: "legal", selected: false },
] as const;

export const LANDING_MATCHES = [
  {
    key: "nihan",
    name: "Nihan Öztürk",
    photo: LANDING_PHOTOS.nihan,
    selected: true,
  },
  {
    key: "cagri",
    name: "Çağrı Yılmaz",
    photo: LANDING_PHOTOS.cagri,
    selected: false,
  },
  {
    key: "deniz",
    name: "Deniz Aksoy",
    photo: LANDING_PHOTOS.deniz,
    selected: false,
  },
] as const;

export const LANDING_TASKS = [
  { key: "financialModel", tone: "or" },
  { key: "acquisition", tone: null },
  { key: "b2b2c", tone: "ok" },
] as const;

/** The "Hangi desteğe ihtiyacım olduğunu nasıl anlarım?" link opens this answer. */
export const LANDING_FAQ_DIFFERENCE_INDEX = 3;

export const LANDING_FOOTER_COLUMNS = [
  {
    key: "platform",
    links: [
      { key: "mentoring", href: "#karsilastirma" },
      { key: "programs", href: "#top" },
      { key: "trainings", href: "#top" },
      { key: "announcements", href: "#duyurular" },
    ],
  },
  {
    key: "support",
    links: [
      { key: "help", href: "#top" },
      { key: "faq", href: "#sss" },
      { key: "contact", href: "#top" },
    ],
  },
  {
    key: "legal",
    links: [
      { key: "privacy", href: "#top" },
      { key: "terms", href: "#top" },
      { key: "kvkk", href: "#top" },
    ],
  },
] as const;

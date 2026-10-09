import { LANDING_PHOTOS, type LandingContent } from "@/lib/const/landing";
import { LandingMock } from "@/types/landing";

/**
 * The English landing page. It mirrors LANDING_CONTENT field by field; the
 * cast below keeps the literal tones and keys of the Turkish source, and
 * test/lib/const/landing.test.ts checks the two shapes stay the same.
 */
export const LANDING_CONTENT_EN = {
  navLinks: [
    { label: "How it works", href: "#nasil" },
    { label: "Announcements", href: "#duyurular" },
    { label: "Mentoring or training?", href: "#karsilastirma" },
    { label: "FAQ", href: "#sss" },
  ],
  hero: {
    eyebrow: "ODTÜ Teknokent",
    headline: "Get the right support for your startup, at the right time",
    accentPrefix: "right",
    lead: "Follow ODTÜ Teknokent programs, mentorship meetings, trainings and your startup's progress on one platform.",
    note: "You can only sign in with the role you were invited to or registered with.",
    sceneTitle: "Start in 3 steps",
    sceneSteps: [
      "Create your profile",
      "Complete your need",
      "Meet the right mentor",
    ],
    match: { title: "Match made", detail: "Nihan Öztürk · UX/UI & Product" },
  },
  announcements: [
    {
      tag: "Application",
      tone: "or",
      date: "27 July 2026",
      title: "Applications for the new term are open",
      text: "Review the program's new application dates and participation requirements.",
      mock: LandingMock.Calendar,
    },
    {
      tag: "Training",
      tone: "bl",
      date: "3 August 2026",
      title: "Product development training",
      text: "A group training on validating a product idea and building the first product.",
      mock: LandingMock.Training,
    },
    {
      tag: "Support program",
      tone: null,
      date: "Applications open",
      title: "TÜBİTAK BİGG applications",
      text: "Follow the required documents and the schedule for the application on the program page.",
      mock: LandingMock.Checklist,
    },
  ],
  howSteps: [
    {
      title: "Share your need",
      text: "Tell us the topic you want support on and the problem you face.",
    },
    {
      title: "Match with the right mentor",
      text: "Get matched with a mentor who fits your field and your startup's stage.",
    },
    {
      title: "Hold your meeting",
      text: "In the meeting, go through your needs, the risks and the possible solutions.",
    },
    {
      title: "Track your actions",
      text: "Follow the tasks and next steps agreed in the meeting on the platform.",
    },
  ],
  stageRoles: {
    mentor: { key: "mentor", label: "Mentor" },
    mentee: { key: "mentee", label: "Mentee / Startup" },
  },
  typedProblem:
    "Our onboarding flow doesn't explain our value proposition on the first screen; users leave at the first step.",
  topicChips: [
    { label: "Product & UX", selected: true },
    { label: "Finance", selected: false },
    { label: "Value proposition", selected: true },
    { label: "MVP stage", selected: true },
    { label: "Legal", selected: false },
  ],
  matches: [
    {
      name: "Nihan Öztürk",
      field: "UX/UI & Product Strategy",
      photo: LANDING_PHOTOS.nihan,
      pill: "Recommended",
      selected: true,
    },
    {
      name: "Çağrı Yılmaz",
      field: "Finance & Business Model",
      photo: LANDING_PHOTOS.cagri,
      pill: "Free · Wed",
      selected: false,
    },
    {
      name: "Deniz Aksoy",
      field: "Growth Strategy",
      photo: LANDING_PHOTOS.deniz,
      pill: "2 slots",
      selected: false,
    },
  ],
  matchReason:
    "Your product positioning and onboarding need matches the value proposition work Nihan has done with early-stage teams.",
  agenda: [
    "Review the current user flow",
    "Critique the value proposition draft",
    "Risks and possible solutions",
    "Work for the next two weeks",
  ],
  tasks: [
    {
      title: "Financial model draft",
      source: "Çağrı Yılmaz · mentorship task",
      status: "Not uploaded",
      tone: "or",
    },
    {
      title: "Acquisition channel analysis",
      source: "METU Stars · program task",
      status: "In progress",
      tone: null,
    },
    {
      title: "B2B2C hypothesis",
      source: "Selin Kaya · mentorship task",
      status: "Done",
      tone: "ok",
    },
  ],
  compare: {
    mentoring: {
      title: "Mentoring",
      text: "Individual or team-focused support shaped by your startup's current situation and needs.",
      points: [
        "Tailored to your startup",
        "Focused on problems and decisions",
        "One-to-one or small-team meetings",
        "Actions can be agreed at the end of a meeting",
      ],
    },
    training: {
      title: "Training",
      text: "Structured content designed to build knowledge and skills on a specific topic.",
      points: [
        "Focused on a specific topic",
        "Run for individuals or groups",
        "Held online or in person",
        "Can include assignments and training materials",
      ],
    },
  },
  faqs: [
    {
      question: "Who can sign in to the platform?",
      answer:
        "Startups accepted into ODTÜ Teknokent programs, and the mentors, trainers and coordinators invited by the program team, can sign in. Registration is not open to everyone; you sign in with the role you were invited to.",
    },
    {
      question: "How do I find my mentor?",
      answer:
        "When you share the topic you want support on and the problem you face, you see mentor suggestions based on expertise, startup stage and availability. Each suggestion comes with a short reason explaining why it fits you.",
    },
    {
      question: "How can I join a program?",
      answer:
        "Program applications are shared in the Announcements section during application periods. When your application is accepted, an invitation is sent to your email so you can sign in.",
    },
    {
      question: "What is the difference between training and mentoring?",
      answer:
        "Mentoring is one-to-one or small-team meetings shaped by your startup's current situation and focused on decisions. Training is structured content designed to build knowledge and skills on a topic. If you have a specific problem, mentoring fits better; if you want to learn a topic from scratch, training does.",
    },
    {
      question: "Can I take part in more than one program?",
      answer:
        "That depends on each program's participation requirements. You can learn whether you can join more than one program in the same period from the program's requirements or the program team.",
    },
    {
      question: "How are mentorship meetings scheduled?",
      answer:
        "Meetings are scheduled from the mentor's available times. Each meeting comes with an agenda, the notes of the previous meeting and the items to finish beforehand, so both sides arrive prepared.",
    },
    {
      question: "I can't find my invitation email. What should I do?",
      answer:
        "First check your spam and promotions folders. If you still can't find it, contact your program's coordinator and ask them to send the invitation again.",
    },
    {
      question: "Who can see my information on the platform?",
      answer:
        "Meeting notes, task details and the documents you share are only visible to you and your mentor. Program management does not see the content; it only sees summary indicators such as how often you meet and how many tasks are completed.",
    },
  ],
  cta: {
    title: "Access your program and your workspace",
    text: "Follow your mentorship meetings, trainings and startup journey in one place.",
  },
  footer: {
    tagline: "Mentorship and Startup Programs Platform.",
    text: "The digital platform offering mentorship, training and program management to ODTÜ Teknokent startups.",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "What is mentoring?", href: "#karsilastirma" },
          { label: "Programs", href: "#top" },
          { label: "Trainings", href: "#top" },
          { label: "Announcements", href: "#duyurular" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Help Center", href: "#top" },
          { label: "Frequently Asked Questions", href: "#sss" },
          { label: "Contact", href: "#top" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "#top" },
          { label: "Terms of Use", href: "#top" },
          { label: "KVKK (data protection)", href: "#top" },
        ],
      },
    ],
    copyright: "© 2026 ODTÜ Teknokent. All rights reserved.",
  },
  ui: {
    open: "Open",
    augustShort: "3 Aug",
    viewDetails: "View details",
    viewAllAnnouncements: "View all announcements",
    announcementsEyebrow: "Announcements",
    compareEyebrow: "Comparison",
    whichSupport: "How do I know which support I need?",
    howEyebrow: "Mentoring",
    supportTopic: "The topic you want support on",
    currentProblem: "Your current problem",
    session: "Session 4 / 6",
    agendaLabel: "Agenda",
    faqEyebrow: "FAQ",
    homeLabel: "menton home",
    mainMenu: "Main menu",
    howItWorks: "How it works",
    howTitleStart: "How does",
    howTitleEnd: "mentoring work?",
    howLead:
      "Mentoring lets you work through your startup's problems with experienced people, gain new perspectives and clarify your next steps.",
    howStepsLabel: "Mentoring steps",
    autoplaying: "Playing automatically · click a step to jump to it",
    paused: "Paused · click between the steps to browse",
    sendRequest: "Send request",
    whyRecommended: "Why recommended?",
    meetingWhen: "30 August · 14:00 · 45 min",
    meetingTitle: "Product positioning decisions",
    stageTasks: "Your tasks at this stage",
    stageName: "MVP · Value proposition & onboarding",
    stageProgress: "Stage progress",
    compareTitleStart: "What is the difference between",
    compareTitleEnd: "mentoring and training?",
    announcementsTitle: "Latest news",
    announcementsLead:
      "Follow the latest news about programs, trainings and events.",
    announcementsLabel: "Announcements (pauses on hover)",
    mockApplication: "Application period",
    mockTraining: "Group training",
    mockDocuments: "Application documents",
    faqTitleStart: "Frequently asked",
    faqTitleEnd: "questions",
    faqLead:
      "If you can't find your answer, reach the program team from inside the platform.",
  },
} as unknown as LandingContent;

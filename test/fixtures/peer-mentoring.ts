import { BadgeCode, BadgeKind } from "@/interfaces/badges";
import { Weekday } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerTopicCategory,
  type CreatePeerMentoringRequestInput,
  type PeerCategoryCount,
  type PeerMentorCard,
  type PeerMentorDetail,
  type PeerMentorFilter,
  type PeerMentoringPerson,
  type PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";

// Test stand-in for the peer-mentoring API: the same filtering and request rules the backend applies.
const STUDENT: PeerMentoringPerson = {
  userId: "fixture-student-1",
  fullName: "Ayşe Yılmaz",
  department: "Bilgisayar Mühendisliği",
};

export const PEER_MENTORS_FIXTURE: PeerMentorCard[] = [
  {
    mentorId: "fixture-peer-1",
    fullName: "Deniz Kaya",
    department: "Bilgisayar Mühendisliği",
    classYear: 4,
    categories: [
      PeerTopicCategory.CareerInternship,
      PeerTopicCategory.TechnicalDigital,
    ],
    helpWith:
      "Yazılım stajı başvuruları, CV ve teknik mülakatlara hazırlık konusunda yardımcı olabilirim.",
    recommendationReasons: ["Bu derste güçlü: CENG 242", "Aynı bölüm"],
    capacityFull: false,
    availableThisWeek: true,
    badges: [
      {
        code: BadgeCode.Sessions10,
        kind: BadgeKind.Achievement,
        programId: "fixture-program",
        awardedAt: "2026-10-01T10:00:00+03:00",
      },
    ],
  },
  {
    mentorId: "fixture-peer-2",
    fullName: "Elif Şahin",
    department: "Endüstri Mühendisliği",
    classYear: 3,
    categories: [
      PeerTopicCategory.International,
      PeerTopicCategory.AcademicDevelopment,
    ],
    helpWith:
      "Erasmus başvurusu, ders denkliği ve yurt dışında bir dönem geçirmek üzerine konuşabiliriz.",
    recommendationReasons: ["Yurt dışı deneyimi var"],
    capacityFull: false,
    availableThisWeek: false,
    badges: [],
  },
  {
    mentorId: "fixture-peer-3",
    fullName: "Mert Aydın",
    department: "Elektrik-Elektronik Mühendisliği",
    classYear: 4,
    categories: [
      PeerTopicCategory.Entrepreneurship,
      PeerTopicCategory.ResearchAcademicCareer,
    ],
    helpWith:
      "Bir proje fikrini prototipe çevirmek ve lisans araştırma projelerine katılmak konusunda deneyimimi paylaşırım.",
    recommendationReasons: ["Benzer bir projede çalıştı"],
    capacityFull: true,
    availableThisWeek: false,
    badges: [],
  },
  {
    mentorId: "fixture-peer-4",
    fullName: "Zeynep Arslan",
    department: "Psikoloji",
    classYear: 3,
    categories: [
      PeerTopicCategory.CampusLife,
      PeerTopicCategory.PersonalProfessional,
    ],
    helpWith:
      "Kampüse uyum, zaman yönetimi ve kulüplerde sorumluluk almak konusunda yanındayım.",
    recommendationReasons: [],
    capacityFull: false,
    availableThisWeek: true,
    badges: [],
  },
];

const INITIAL_REQUESTS: PeerMentoringRequest[] = [
  {
    id: "fixture-peer-request-1",
    mentor: {
      userId: "fixture-peer-2",
      fullName: "Elif Şahin",
      department: "Endüstri Mühendisliği",
    },
    mentee: STUDENT,
    category: PeerTopicCategory.International,
    message:
      "Bahar döneminde Erasmus'a başvurmak istiyorum, nereden başlamalıyım?",
    status: MentorshipRequestStatus.Pending,
    createdAt: "2026-11-06T10:15:00+03:00",
    acceptedAt: null,
  },
];

let requests: PeerMentoringRequest[] = structuredClone(INITIAL_REQUESTS);
let nextRequest = 1;

/** The catalogue sub-topics each fixture mentor offers (ids from the profile-completion catalogue). */
export const PEER_MENTOR_SUBTOPICS: Record<string, string[]> = {
  "fixture-peer-1": ["fixture-cv", "fixture-code"],
  "fixture-peer-2": ["fixture-exchange"],
  "fixture-peer-3": ["fixture-project"],
  "fixture-peer-4": ["fixture-clubs", "fixture-time"],
};

export function peerMentorsFixture({
  category,
  query,
  subTopic,
  availableThisWeek,
}: PeerMentorFilter) {
  const needle = query.trim().toLocaleLowerCase("tr");
  return PEER_MENTORS_FIXTURE.filter(
    (mentor) =>
      (!category || mentor.categories.includes(category)) &&
      (!subTopic ||
        (PEER_MENTOR_SUBTOPICS[mentor.mentorId] ?? []).includes(subTopic)) &&
      (!availableThisWeek || mentor.availableThisWeek) &&
      (!needle ||
        [mentor.fullName, mentor.department ?? "", mentor.helpWith].some(
          (text) => text.toLocaleLowerCase("tr").includes(needle),
        )),
  );
}

/** One fixture mentor's profile page, or null for an id the directory doesn't list. */
export function peerMentorDetailFixture(
  mentorId: string,
): PeerMentorDetail | null {
  const card = PEER_MENTORS_FIXTURE.find((item) => item.mentorId === mentorId);
  if (!card) return null;
  const isDeniz = mentorId === "fixture-peer-1";
  return {
    ...card,
    subTopics: [...(PEER_MENTOR_SUBTOPICS[mentorId] ?? []), "Serbest konu"],
    strongCourses: isDeniz ? ["CENG 242", "CENG 315"] : [],
    projects: isDeniz ? ["Kampüs etkinlik uygulaması"] : [],
    erasmus: isDeniz ? "TU Delft, 2025 bahar" : null,
    linkedinUrl: isDeniz ? "https://www.linkedin.com/in/deniz-kaya" : null,
    weeklyHours: isDeniz
      ? [
          {
            id: "fixture-rule-sat",
            dayOfWeek: Weekday.Saturday,
            startTime: "12:00:00",
            endTime: "15:00:00",
            slotMinutes: 60,
          },
          {
            id: "fixture-rule-tue",
            dayOfWeek: Weekday.Tuesday,
            startTime: "18:00:00",
            endTime: "20:00:00",
            slotMinutes: 60,
          },
        ]
      : [],
  };
}

/** Mentors per category, counted the way the backend does over the fixture directory. */
export function peerMentorCountsFixture(
  active: readonly PeerTopicCategory[],
): PeerCategoryCount[] {
  return active.map((category) => ({
    category,
    mentorCount: PEER_MENTORS_FIXTURE.filter((mentor) =>
      mentor.categories.includes(category),
    ).length,
  }));
}

export function peerMentoringRequestsFixture() {
  return requests;
}

export function addPeerMentoringRequestFixture(
  input: CreatePeerMentoringRequestInput,
): PeerMentoringRequest {
  const mentor = PEER_MENTORS_FIXTURE.find(
    (item) => item.mentorId === input.mentorId,
  );
  if (!mentor) throw new Error(`Unknown fixture mentor ${input.mentorId}`);
  const request: PeerMentoringRequest = {
    id: `fixture-peer-request-new-${nextRequest++}`,
    mentor: {
      userId: mentor.mentorId,
      fullName: mentor.fullName,
      department: mentor.department,
    },
    mentee: STUDENT,
    category: input.category,
    message: input.message,
    status: MentorshipRequestStatus.Pending,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
  };
  requests = [request, ...requests];
  return request;
}

export function resetPeerMentoringFixtures() {
  requests = structuredClone(INITIAL_REQUESTS);
  nextRequest = 1;
}

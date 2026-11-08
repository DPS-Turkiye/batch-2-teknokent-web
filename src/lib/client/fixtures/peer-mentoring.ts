import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  type CreatePeerMentoringRequestInput,
  type PeerMentorCard,
  type PeerMentorFilter,
  type PeerMentoringRequest,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";

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
  },
];

const INITIAL_REQUESTS: PeerMentoringRequest[] = [
  {
    id: "fixture-peer-request-1",
    mentor: {
      mentorId: "fixture-peer-2",
      fullName: "Elif Şahin",
      department: "Endüstri Mühendisliği",
    },
    category: PeerTopicCategory.International,
    message:
      "Bahar döneminde Erasmus'a başvurmak istiyorum, nereden başlamalıyım?",
    status: MentorshipRequestStatus.Pending,
    createdAt: "2026-11-06T10:15:00+03:00",
  },
];

// Requests sent while the page is open stay until a reload, as the backend's would.
let requests: PeerMentoringRequest[] = structuredClone(INITIAL_REQUESTS);
let nextRequest = 1;

export function peerMentorsFixture({ category, query }: PeerMentorFilter) {
  const needle = query.trim().toLocaleLowerCase("tr");
  return PEER_MENTORS_FIXTURE.filter(
    (mentor) =>
      (!category || mentor.categories.includes(category)) &&
      (!needle ||
        [mentor.fullName, mentor.department ?? "", mentor.helpWith].some(
          (text) => text.toLocaleLowerCase("tr").includes(needle),
        )),
  );
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
      mentorId: mentor.mentorId,
      fullName: mentor.fullName,
      department: mentor.department,
    },
    category: input.category,
    message: input.message,
    status: MentorshipRequestStatus.Pending,
    createdAt: new Date().toISOString(),
  };
  requests = [request, ...requests];
  return request;
}

/** Tests start every case from the same requests. */
export function resetPeerMentoringFixtures() {
  requests = structuredClone(INITIAL_REQUESTS);
  nextRequest = 1;
}

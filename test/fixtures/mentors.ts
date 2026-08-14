import type { AxiosResponse } from "axios";

import type { MentorProfile } from "@/interfaces/mentor";

export const mentorProfile: MentorProfile = {
  id: "00000000-0000-0000-0000-000000000002",
  fullName: "Dr. Kemal Arslan",
  email: "kemal.arslan@teknokent.demo",
  initials: "DK",
  professionalTitle: "Ürün & Araştırma Direktörü",
  company: "Trendyol",
  availabilityLabel: "Bu hafta müsait",
  responseTimeLabel: "~24 saat",
  meetingMode: "Online",
  communicationPreference: "Mesajlaşma açık",
  mentoringStyle: "Yapılandırılmış & Uygulamalı",
  fitLabel: "Çok yüksek",
  experienceLevel: "Kullanıcı testi, UX",
  sectorExperience: "E-ticaret, SaaS",
  startupStages: "Seed & MVP",
  specialties: ["Kullanıcı araştırması", "MVP testi", "UX stratejisi"],
  recommendationReasons: ["Kullanıcı testi süreçlerinde deneyimli"],
  recommendationEvidence: [
    {
      category: "Kullanıcı araştırması",
      claim: "B2B SaaS ürünlerinde kullanıcı araştırması yürüttü",
      quote: "MVP kullanıcı testleri ve görüşme sentezleri yürüttü.",
      sourcePage: 2,
      profileVersion: "demo-confirmed-v1",
    },
  ],
};

export function createMentorResponse(
  data: unknown,
  status = 200,
): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {},
    config: { headers: {} } as AxiosResponse["config"],
  };
}

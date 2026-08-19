export interface MentorEvidence {
  category: string;
  claim: string;
  quote: string;
  sourcePage: number | null;
  profileVersion: string;
}

export interface MentorProfile {
  id: string;
  fullName: string;
  email: string;
  initials: string;
  professionalTitle: string;
  company: string;
  availabilityLabel: string;
  responseTimeLabel: string;
  meetingMode: string;
  communicationPreference: string;
  mentoringStyle: string;
  fitLabel: string;
  experienceLevel: string;
  sectorExperience: string;
  startupStages: string;
  specialties: string[];
  recommendationReasons: string[];
  recommendationEvidence: MentorEvidence[];
}

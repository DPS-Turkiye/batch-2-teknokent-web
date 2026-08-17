export type MentorRequestMentor = {
  initials: string;
  name: string;
  role: string;
  availability: string;
  tags: string[];
  meta: string[];
  reasons: string[];
};

export enum MentorRequestStep {
  Need = 1,
  Expectation = 2,
  Info = 3,
  MentorSelect = 4,
  Review = 5,
}

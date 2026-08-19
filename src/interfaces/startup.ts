export interface StartupContext {
  organizationId: string;
  name: string;
  summary: string;
  sector: string;
  stage: string;
  teamSize?: number;
  technologies: string[];
  confirmedProfile: boolean;
  sourceFilename?: string;
}

/** Someone on the "Kurucuyu değiştir" dialog; no e-mail is sent. */
export interface FounderChangePerson {
  id: string;
  fullName: string;
  jobTitle: string | null;
}

/** The startup, its founder now, and the approved members who may take over. */
export interface FounderChangeOptions {
  organizationId: string;
  name: string;
  currentFounder: FounderChangePerson | null;
  candidates: FounderChangePerson[];
}

export interface FounderChangeResult {
  organizationId: string;
  previousFounderId: string | null;
  founderId: string;
  changedAt: string;
}

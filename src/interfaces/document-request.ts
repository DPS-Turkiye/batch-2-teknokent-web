export type DocumentRequestUpload = {
  id: string;
  storedDocumentId: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
};

export type DocumentRequestItem = {
  id: string;
  title: string;
  sortOrder: number;
  dueDate: string | null;
  organizationId: string;
  mentorshipRequestId: string | null;
  meetingId: string | null;
  mentorshipId: string | null;
  programId: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  uploads: DocumentRequestUpload[];
};

export type DocumentRequestScope = {
  mentorshipRequestId?: string;
  meetingId?: string;
  mentorshipId?: string;
};

export interface TaskAssignee {
  id: string;
  fullName: string;
}

export interface AssignMentorshipTaskInput {
  ownerId: string;
  title: string;
  description?: string | undefined;
  dueDate?: string | undefined;
}

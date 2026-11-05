export interface TaskAssignee {
  id: string;
  fullName: string;
}

export interface AssignMentorshipTaskInput {
  ownerId: string;
  title: string;
  description?: string;
  dueDate?: string;
}

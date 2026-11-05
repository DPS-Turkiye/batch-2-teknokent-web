import {
  type Program,
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
} from "@/interfaces/program";

/** Programs the mentor asked to join, or joined through an emailed link, still waiting for the coordinator. */
export function programsAwaitingReview(
  programs: Program[],
  mentorId: string | undefined,
) {
  if (!mentorId) return [];
  return programs.filter((program) =>
    program.mentors.some(
      (mentor) =>
        mentor.mentorId === mentorId &&
        mentor.status === ProgramMentorStatus.Pending &&
        mentor.invitedBy === ProgramMentorInvitedBy.Mentor,
    ),
  );
}

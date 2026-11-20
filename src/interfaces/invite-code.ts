/** The backend's answer to a team code check: whether it opens a team, and that team's name. */
export type InviteCodeCheck = {
  valid: boolean;
  teamName: string | null;
};

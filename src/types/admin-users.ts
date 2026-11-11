/** The tabs of the admin's Kullanıcılar screen; each one has its own route under /admin/users. */
export enum UserTab {
  Coordinators = "coordinators",
  Mentors = "mentors",
  Teams = "teams",
  Students = "students",
  Academics = "academics",
}

/** The filter chips above the coordinator, mentor and team tables; the values are keys of `adminUsers.filters`. */
export enum UserFilter {
  All = "ALL",
  Active = "ACTIVE",
  Pending = "PENDING",
  NoAccess = "NO_ACCESS",
  Inactive = "INACTIVE",
  Invited = "INVITED",
  Mentored = "MENTORED",
  Waiting = "WAITING",
  Risky = "RISKY",
}

/** The section tabs of the user drawers; the values are keys of `adminUsers.sections`. */
export enum UserDrawerSection {
  Overview = "OVERVIEW",
  Assigned = "ASSIGNED",
  Access = "ACCESS",
  Activity = "ACTIVITY",
  Programs = "PROGRAMS",
  Mentorships = "MENTORSHIPS",
  Team = "TEAM",
  Mentorship = "MENTORSHIP",
}

/** How a mentored team is doing in the Takımlar table; the values are keys of `adminUsers.health`. */
export enum TeamHealth {
  Risky = "RISKY",
  FollowUp = "FOLLOW_UP",
  Healthy = "HEALTHY",
}

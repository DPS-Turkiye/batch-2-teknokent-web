export enum NotificationCategory {
  General = "GENERAL",
  Message = "MESSAGE",
  MeetingReminder = "MEETING_REMINDER",
  MeetingChange = "MEETING_CHANGE",
  TaskAssigned = "TASK_ASSIGNED",
  TaskDeadline = "TASK_DEADLINE",
  StartupActivity = "STARTUP_ACTIVITY",
  /** A badge awarded or taken back; never muted, so it has no preference switch. */
  Badge = "BADGE",
}

/** One switch per muteable category (GENERAL notifications are always sent), and one for every e-mail. */
export type NotificationPreferences = {
  messages: boolean;
  meetingReminders: boolean;
  meetingChanges: boolean;
  newTasks: boolean;
  taskDeadlines: boolean;
  startupActivity: boolean;
  /** Missing from a backend released before the e-mail switch. */
  emails?: boolean;
};

export type NotificationPreferenceKey = keyof NotificationPreferences;

export type UnreadNotificationCount = { unread: number };

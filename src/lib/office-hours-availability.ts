import type {
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
} from "@/interfaces/mentor";

type BackendAvailability = Omit<
  MentorAvailabilitySettings,
  "menteeCapacity"
> & {
  studentCapacity: number | null;
};

/**
 * Office hours reuse the mentor availability editor, which calls the capacity menteeCapacity; the backend calls
 * it studentCapacity. These two keep the rename at the API route, so neither side has to learn the other's word.
 */
export function toEditorSettings<Backend extends BackendAvailability>(
  backend: Backend,
): Omit<Backend, "studentCapacity"> & MentorAvailabilitySettings {
  const { studentCapacity, ...rest } = backend;
  return { ...rest, menteeCapacity: studentCapacity };
}

/** Anything besides the capacity (one-off hours, say) passes through both ways untouched. */
export function toBackendPayload<
  Payload extends UpdateMentorAvailabilitySettingsPayload,
>(payload: Payload) {
  const { menteeCapacity, ...rest } = payload;
  return { ...rest, studentCapacity: menteeCapacity };
}

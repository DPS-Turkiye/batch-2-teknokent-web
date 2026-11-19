import { z } from "zod";

import { MentorLabelColor } from "@/interfaces/mentor-label";
import {
  MENTOR_LABEL_NAME_MAX_LENGTH,
  MENTOR_LABELS_PER_MENTOR,
} from "@/lib/const/mentor-labels";
import {
  mentorLabelNameLength,
  normalizeMentorLabelName,
} from "@/lib/mentor-labels";

export const mentorLabelSchema = z.object({
  name: z
    .string()
    .transform(normalizeMentorLabelName)
    .refine(
      (name) =>
        name.length > 0 &&
        mentorLabelNameLength(name) <= MENTOR_LABEL_NAME_MAX_LENGTH,
    ),
  color: z.enum(MentorLabelColor),
});

export const mentorLabelIdsSchema = z.object({
  labelIds: z.array(z.uuid()).max(MENTOR_LABELS_PER_MENTOR),
});

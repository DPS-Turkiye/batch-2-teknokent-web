import styles from "@/components/landing/landing.module.css";

export { styles };

/** The design's own class names ("btn", "btn-or", …) mapped to the module's scoped ones. */
export function cx(...names: (string | false | null | undefined)[]) {
  return names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? "")
    .join(" ");
}

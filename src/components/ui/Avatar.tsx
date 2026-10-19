type Tone = "leaf" | "turmeric" | "sky" | "brick";
const TONES: Tone[] = ["leaf", "turmeric", "sky", "brick"];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0])
    .join("")
    .toUpperCase();

// The same name always gets the same tone, so a colour follows the entity and not its position in a list
const toneOf = (name: string): Tone => TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  square?: boolean; // item thumbnails are rounded squares, people are circles
  tone?: Tone | "auto";
  src?: string | null; // a picture replaces the initials
}

/** Initials (or a picture) in a soft tile. Decorative: the name always sits beside it. */
export function Avatar({ name, size = "sm", square = false, tone = "leaf", src }: AvatarProps) {
  const t = tone === "auto" ? toneOf(name) : tone;
  const cls = ["ui-avatar", `ui-avatar--${size}`, `ui-avatar--${t}`, square && "ui-avatar--square"].filter(Boolean).join(" ");
  return src ? (
    <img className={cls} src={src} alt="" loading="lazy" />
  ) : (
    <span className={cls} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

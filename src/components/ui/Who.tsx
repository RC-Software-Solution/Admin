import type { ComponentProps, ReactNode } from "react";
import { Avatar } from "./Avatar";

interface WhoProps {
  name: string;
  meta?: ReactNode; // email, description, a badge
  square?: boolean; // items and areas are rounded squares, people are circles
  src?: string | null;
  tone?: ComponentProps<typeof Avatar>["tone"];
  size?: "sm" | "md";
}

/** The first cell of a people or items list: avatar, bold name, muted detail line. */
export function Who({ name, meta, square, src, tone = "leaf", size }: WhoProps) {
  return (
    <div className="ui-who">
      <Avatar name={name} square={square} src={src} tone={tone} size={size} />
      <div className="ui-who__text">
        <b className="ui-cell__title">{name}</b>
        {meta && <div className="ui-cell__meta">{meta}</div>}
      </div>
    </div>
  );
}

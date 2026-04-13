import type { ReactNode } from "react";

type NoticeTone = "info" | "success" | "warning" | "danger";

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: NoticeTone;
}) {
  return (
    <div className={`notice notice--${tone}`}>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

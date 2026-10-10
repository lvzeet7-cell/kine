import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: ReactNode;
  kicker?: string;
  intro?: ReactNode;
  as?: "h1" | "h2";
  align?: "left" | "center";
  className?: string;
  id?: string;
  children?: ReactNode;
};

/** Titre de section : kicker optionnel, titre, introduction */
export function SectionHeading({ title, kicker, intro, as = "h2", align = "left", className, id, children }: Props) {
  const Tag = as;
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {kicker && <p className="kicker mb-4">{kicker}</p>}
      <Tag id={id} className={as === "h1" ? "text-h1" : "text-h2"}>
        {title}
      </Tag>
      {intro && <div className="mt-5 text-lead text-muted">{intro}</div>}
      {children}
    </div>
  );
}

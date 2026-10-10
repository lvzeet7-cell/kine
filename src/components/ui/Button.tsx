import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outlineLight";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold tracking-[-0.005em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-petrol text-white shadow-[0_1px_0_rgb(255_255_255/0.12)_inset] hover:bg-petrol-deep hover:shadow-lift",
  secondary: "border border-ink/15 bg-surface text-ink hover:border-petrol/40 hover:text-petrol",
  ghost: "text-petrol hover:bg-petrol-soft",
  light: "bg-white text-petrol-deep hover:bg-sage-soft",
  outlineLight: "border border-white/30 text-white hover:border-white/70 hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.9375rem]",
  md: "h-12 px-6 text-[0.975rem]",
  lg: "h-14 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

type ButtonLinkProps = Common & {
  href: string;
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "className" | "children">;

/** Lien stylé comme un bouton (interne via next/link, externe sinon) */
export function ButtonLink({ href, external, variant, size, className, children, ...rest }: ButtonLinkProps) {
  const classes = buttonClasses(variant, size, className);
  const isExternal = external ?? /^(https?:|tel:|mailto:)/.test(href);
  if (isExternal) {
    const newTab = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

type ButtonProps = Common & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function Button({ variant, size, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

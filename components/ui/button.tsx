import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-hover active:scale-[0.98] disabled:hover:bg-brand",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-card hover:bg-surface-2 active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink active:scale-[0.98]",
  danger:
    "bg-danger text-white shadow-sm hover:bg-danger/90 active:scale-[0.98] disabled:hover:bg-danger",
  success:
    "bg-live text-white shadow-sm hover:bg-live/90 active:scale-[0.98] disabled:hover:bg-live",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9.5 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

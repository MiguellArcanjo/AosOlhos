"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn, statusInfo } from "@/lib/utils";
import type { GalleryStatus } from "@/lib/types";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:opacity-85",
  secondary: "border border-line bg-surface text-foreground hover:bg-accent-soft",
  ghost: "text-foreground hover:bg-accent-soft",
  danger: "bg-danger text-white hover:opacity-90",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
    buttonStyles[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function Logo({ className, children = "Aos Olhos" }: { className?: string; children?: React.ReactNode }) {
  return (
    <span className={cn("font-serif text-2xl tracking-[0.2em] uppercase", className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: GalleryStatus }) {
  const info = statusInfo[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", info.className)}>
      {info.label}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cn("w-full max-w-lg rounded-t-2xl bg-surface p-6 shadow-xl sm:rounded-2xl", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && <h2 className="font-serif text-2xl">{title}</h2>}
          <button type="button" onClick={onClose} className="-m-1 ml-auto rounded-full p-1 text-muted hover:bg-accent-soft" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

export function Spinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

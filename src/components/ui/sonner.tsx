"use client";

import { Toaster as SonnerPrimitive, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => {
  return (
    <SonnerPrimitive
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--color-popover)] group-[.toaster]:text-[var(--color-popover-foreground)] group-[.toaster]:border-[var(--color-border)] group-[.toaster]:shadow-[var(--shadow-popover)] group-[.toaster]:rounded-[var(--radius-lg)]",
          description: "group-[.toast]:text-[var(--color-muted-foreground)]",
          actionButton:
            "group-[.toast]:bg-[var(--color-primary)] group-[.toast]:text-[var(--color-primary-foreground)]",
          cancelButton:
            "group-[.toast]:bg-[var(--color-muted)] group-[.toast]:text-[var(--color-muted-foreground)]"
        }
      }}
      {...props}
    />
  );
};

export { Toaster };

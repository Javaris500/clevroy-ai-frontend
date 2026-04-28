"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SettingsFieldProps {
  /** Visible label. */
  label: React.ReactNode;
  /** Helper text below the input. */
  helper?: React.ReactNode;
  /** Inline validation error (string or ReactNode). When set, replaces helper. */
  error?: React.ReactNode;
  /** Required asterisk + aria-required on the child input. */
  required?: boolean;
  /** Caps the field width to max-w-md so single-line inputs don't span full
   *  page width on a wide settings panel. */
  compact?: boolean;
  /** Connect label/helper/error to the input. The caller passes the same id
   *  to its <Input>/<Textarea>/etc. so screen readers wire up correctly. */
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * The one canonical form-field pattern across /settings/*. Wraps any input
 * (shadcn Input, Textarea, Switch, custom) with label / helper / error in a
 * vertical stack. Replaces the ad-hoc <div className="space-y-2"><label>…
 * patterns scattered across the previous sub-routes.
 */
export function SettingsField({
  label,
  helper,
  error,
  required,
  compact,
  htmlFor,
  className,
  children,
}: SettingsFieldProps) {
  const helperId = htmlFor ? `${htmlFor}-helper` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        compact ? "max-w-md" : "w-full",
        className,
      )}
    >
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

import * as React from "react";

// Onboarding sits OUTSIDE the (app) RoundedShell — first-time users haven't
// seen the app chrome yet, and CC-1's theme-choice step needs to read against
// a clean canvas regardless of the user's persisted theme preference.
//
// The layout itself is intentionally minimal: a centered viewport-height frame
// that adapts to safe-area insets on mobile. Each step page composes its own
// hero + body inside this frame.

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground transition-colors duration-300 motion-reduce:transition-none">
      <main
        className="mx-auto flex min-h-dvh max-w-2xl flex-col items-stretch justify-center px-6 py-10"
        style={{
          paddingTop: "max(var(--spacing-safe-top), 2.5rem)",
          paddingBottom: "max(var(--spacing-safe-bottom), 2.5rem)",
        }}
      >
        {children}
      </main>
    </div>
  );
}

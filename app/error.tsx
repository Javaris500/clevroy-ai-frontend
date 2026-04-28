"use client";

// App-level error boundary — Brand_Guide §7.3 / Design_System §12.1.
// Never "Oops!" Never "Something went wrong." Always: "{Specific thing} didn't
// load." plus a clear next action. Leon's <FilmNotFound /> handles the in-app
// film deep-link case; this is the route-level fallback for everything else.

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { routeError } from "@/lib/copy";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces unhandled render errors to whatever logger the app wires up.
    // For MVP it's `console.error`; replace with a real reporter later.
    console.error("[clevroy.route-error]", error);
  }, [error]);

  return (
    <main
      role="alert"
      className="flex min-h-dvh items-center justify-center bg-background p-6"
    >
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-h2">{routeError.fallbackTitle}</h1>
          <p className="text-body text-muted-foreground">
            {routeError.fallbackBody}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>{routeError.retry}</Button>
          <Button variant="outline" asChild>
            <a href="/home">{routeError.backHome}</a>
          </Button>
        </div>
        {error.digest ? (
          <p className="text-mono text-caption text-muted-foreground">
            Ref: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}

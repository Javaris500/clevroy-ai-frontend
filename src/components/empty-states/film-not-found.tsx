import Link from "next/link";

import { Button } from "@/components/ui/button";
import { emptyStates } from "@/lib/copy";

// EC-N8: 404 (film doesn't exist) and 403 (film belongs to someone else) MUST
// render the same state so we don't leak existence. Stratum's films query
// surfaces both as the same error variant; this component is the canonical UI
// for that variant. Nemi composes it inside app/(app)/films/[id]/page.tsx
// when the loader returns notFound or notOwned.

export function FilmNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-foreground">
          {emptyStates.filmNotFound.headline}
        </h2>
        <p className="text-body text-muted-foreground">
          {emptyStates.filmNotFound.description}
        </p>
      </div>
      <Button asChild>
        <Link href="/projects">{emptyStates.filmNotFound.cta}</Link>
      </Button>
    </div>
  );
}

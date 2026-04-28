import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { emptyStates } from "@/lib/copy";

/**
 * /projects empty state — Layout_Enhancements A.9.
 *
 * Distinct from the shared `<NoFilmsEmptyState />` (which lives on /home and
 * also serves the no-search-results case). This variant leads with a Fraunces
 * phase-narration line carried over from the centralized-generation language —
 * the archive view is the destination of that phase, so the cinematic voice
 * holds. Brand_Guide §7.4: absence framed as invitation, no "Oops".
 */
export function ProjectsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-border bg-card px-6 py-20 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary"
        aria-hidden="true"
      >
        <Clapperboard className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-phase text-foreground">
          {emptyStates.projectsEmpty.phaseLine}
        </p>
        <p className="text-body text-muted-foreground">
          {emptyStates.projectsEmpty.description}
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/create">{emptyStates.projectsEmpty.cta}</Link>
      </Button>
    </div>
  );
}

// App-level 404. EC-N8 / Brand_Guide §7.3.
// Distinct from Leon's <FilmNotFound /> — that handles `/films/{id}` deep-link
// 404 and 403 (which share copy by design). This handles every other unknown
// route in the app (typos in /settings/*, dangling marketing links, etc.).

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routeNotFound } from "@/lib/copy";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-h2">{routeNotFound.title}</h1>
          <p className="text-body text-muted-foreground">
            {routeNotFound.body}
          </p>
        </div>
        <Button asChild>
          <Link href="/home">{routeNotFound.cta}</Link>
        </Button>
      </div>
    </main>
  );
}

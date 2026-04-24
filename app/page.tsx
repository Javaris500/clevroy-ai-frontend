import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-[var(--color-background)] px-6 text-center text-[var(--color-foreground)]">
      <div className="space-y-4">
        <h1 className="text-display-md md:text-display-lg">
          Your script. On screen. Now.
        </h1>
        <p className="text-body-lg text-[var(--color-muted-foreground)]">
          Scaffold up. Tokens locked. Build the rest on top.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/dev/tokens">Visual token check</Link>
      </Button>
    </main>
  );
}

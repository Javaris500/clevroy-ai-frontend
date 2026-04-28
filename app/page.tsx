import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground">
      <div className="space-y-4">
        <h1 className="text-display-md md:text-display-lg">
          Your script. On screen. Now.
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Watch your story shoot itself.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/onboarding">Start your film</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}

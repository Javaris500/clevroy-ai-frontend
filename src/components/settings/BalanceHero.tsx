"use client";

import * as React from "react";

import { useProfile } from "@/hooks/use-profile";
import { useSubscription } from "@/hooks/use-subscription";
import { settingsBilling } from "@/lib/copy";
import { cn } from "@/lib/utils";

const CELLS = 12;

function formatRenewalDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/**
 * Scaled-up film-strip gauge that visualizes the user's films balance.
 * Subscription view: 12 cells, filled proportionally to the percentage of
 * films remaining in the current period.
 * Pay-as-you-go view: 12 cells, filled = min(films_remaining, 12).
 */
export function BalanceHero() {
  const { profile } = useProfile();
  const { subscription } = useSubscription();

  const filmsRemaining = profile?.films_remaining ?? "0.00";
  const filmsRemainingNum = Math.max(0, Math.floor(Number(filmsRemaining)));

  const isSubscriber = subscription.status === "active";

  const remainingThisPeriod = isSubscriber
    ? Math.max(
        0,
        subscription.films_per_period - subscription.films_used_this_period,
      )
    : filmsRemainingNum;

  const filled = isSubscriber
    ? Math.min(
        CELLS,
        Math.round((remainingThisPeriod / subscription.films_per_period) * CELLS),
      )
    : Math.min(CELLS, filmsRemainingNum);

  const balanceLabel = isSubscriber
    ? settingsBilling.balanceHero.titleSubscription(String(remainingThisPeriod))
    : settingsBilling.balanceHero.titlePayg(filmsRemaining);

  const caption =
    subscription.status === "none"
      ? settingsBilling.balanceHero.captionNone
      : settingsBilling.balanceHero.captionRenews(
          formatRenewalDate(subscription.renews_at),
        );

  return (
    <section
      aria-label="Films balance"
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-h2 font-semibold text-foreground">{balanceLabel}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {caption}
        </p>
      </div>

      <div
        role="img"
        aria-label={`${filled} of ${CELLS} films remaining`}
        className="mt-6 flex items-center gap-1.5"
      >
        {Array.from({ length: CELLS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-9 flex-1 rounded-md border",
              i < filled
                ? "border-primary bg-primary"
                : "border-border bg-transparent",
            )}
          />
        ))}
      </div>
    </section>
  );
}

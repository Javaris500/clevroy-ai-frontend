"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { settingsBilling } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/hooks/_fixtures";

type Interval = "monthly" | "annual";

const PLAN_KEYS: ReadonlyArray<SubscriptionPlan> = [
  "indie",
  "director",
  "studio",
];

/** Compares plan tiers by sort order so we can pick the right CTA verb. */
const PLAN_RANK: Record<SubscriptionPlan, number> = {
  indie: 0,
  director: 1,
  studio: 2,
};

function ctaForPlan(
  current: SubscriptionPlan,
  target: SubscriptionPlan,
): string {
  if (current === target) return settingsBilling.currentPlanBadge;
  if (PLAN_RANK[target] > PLAN_RANK[current]) return settingsBilling.upgradeCta;
  if (PLAN_RANK[target] < PLAN_RANK[current])
    return settingsBilling.downgradeCta;
  return settingsBilling.choosePlanCta;
}

export function PlanTiles() {
  const { subscription } = useSubscription();
  const [interval, setInterval] = React.useState<Interval>(
    subscription.interval,
  );

  return (
    <div className="space-y-5">
      <IntervalToggle value={interval} onChange={setInterval} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLAN_KEYS.map((key) => {
          const plan = settingsBilling.plans[key];
          const isCurrent = subscription.plan === key;
          const cta = ctaForPlan(subscription.plan, key);
          const price =
            interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
          const priceLabel =
            interval === "annual"
              ? settingsBilling.pricePerYear(price)
              : settingsBilling.pricePerMonth(price);

          const handleClick = () => {
            if (isCurrent) return;
            // eslint-disable-next-line no-console
            console.warn("Plan change pending Layer 5", { plan: key, interval });
            toast.success(settingsBilling.planChangeStub(plan.name));
          };

          return (
            <article
              key={key}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 transition-shadow",
                isCurrent
                  ? "border-primary shadow-md"
                  : "border-border shadow-sm hover:shadow-md",
              )}
            >
              <header className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  {plan.name}
                </h3>
                {isCurrent ? (
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    {settingsBilling.currentPlanBadge}
                  </span>
                ) : null}
              </header>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.tagline}
              </p>
              <p className="mt-5 text-3xl font-semibold text-foreground">
                {priceLabel}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {settingsBilling.filmsPerMonth(plan.filmsIncluded)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {settingsBilling.overage(plan.overageRate)}
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                onClick={handleClick}
                disabled={isCurrent}
                variant={isCurrent ? "outline" : "default"}
                className="mt-6 w-full rounded-full"
              >
                {cta}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function IntervalToggle({
  value,
  onChange,
}: {
  value: Interval;
  onChange: (next: Interval) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div
        role="group"
        aria-label="Billing interval"
        className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5"
      >
        {(["monthly", "annual"] as const).map((key) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {key === "monthly"
                ? settingsBilling.monthly
                : settingsBilling.annual}
            </button>
          );
        })}
      </div>
      {value === "annual" ? (
        <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success">
          {settingsBilling.annualSaveBadge}
        </span>
      ) : null}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

import { onboarding } from "@/lib/copy";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 2;

export function OnboardingProgress({ current }: { current: 1 | 2 }) {
  return (
    <div
      role="group"
      aria-label={onboarding.stepLabel(current, TOTAL_STEPS)}
      className="flex items-center gap-2"
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
        const active = step <= current;
        return (
          <span
            key={step}
            aria-hidden="true"
            className={cn(
              "relative h-1.5 w-8 overflow-hidden rounded-full bg-muted",
            )}
          >
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-primary motion-reduce:transition-none"
              initial={false}
              animate={{ width: active ? "100%" : "0%" }}
              transition={{
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </span>
        );
      })}
      <span className="sr-only">
        {onboarding.stepLabel(current, TOTAL_STEPS)}
      </span>
    </div>
  );
}

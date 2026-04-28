"use client";

// Zone 3 — Metadata tab. Per Design_System §7.5:
//   - Generation timestamps (started, completed)
//   - Style + aspect ratio
//   - Credit cost breakdown
//   - Provider call log (collapsed by default — `<details>` element so
//     keyboard expand/collapse is built-in and matches reduced-motion).

import { useState } from "react";

import type { ApiCallSummary, CostBreakdown, FilmDetails } from "../types";
import { metadataLabels, resultsTabs } from "@/lib/copy";

export interface MetadataTabProps {
  film: FilmDetails;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function MetadataTab({ film }: MetadataTabProps) {
  const breakdown = film.cost_breakdown;
  const calls = film.api_calls ?? [];

  // No metadata at all — render the same fallback the other tabs use.
  if (!breakdown && calls.length === 0 && !film.style_preset) {
    return (
      <p className="text-body text-muted-foreground">
        {resultsTabs.metadataEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <GeneratedSection film={film} />
      {breakdown ? <CostSection breakdown={breakdown} /> : null}
      <CallLogSection calls={calls} />
    </div>
  );
}

function GeneratedSection({ film }: { film: FilmDetails }) {
  return (
    <section aria-labelledby="meta-generated" className="space-y-3">
      <h3 id="meta-generated" className="text-h3">
        {metadataLabels.generatedHeader}
      </h3>
      <dl className="grid grid-cols-1 gap-y-2 text-small sm:grid-cols-[max-content_1fr] sm:gap-x-6">
        <Row label={metadataLabels.startedAt} value={formatTimestamp(film.created_at)} />
        <Row
          label={metadataLabels.completedAt}
          value={formatTimestamp(film.completed_at)}
        />
        <Row label={metadataLabels.styleLabel} value={film.style_preset || "—"} />
        <Row
          label={metadataLabels.aspectLabel}
          value={film.aspect_ratio || "—"}
        />
      </dl>
    </section>
  );
}

function CostSection({ breakdown }: { breakdown: CostBreakdown }) {
  return (
    <section aria-labelledby="meta-cost" className="space-y-3">
      <h3 id="meta-cost" className="text-h3">
        {metadataLabels.costHeader}
      </h3>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {breakdown.lines.map((line) => (
          <li
            key={line.label}
            className="flex items-center justify-between gap-3 px-4 py-2 text-small"
          >
            <span className="text-foreground">{line.label}</span>
            {/* NUMERIC(8,2) string preserved verbatim — never coerced to number. */}
            <span className="font-mono text-muted-foreground">
              {line.amount_credits}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 px-4 py-2 text-body-md">
          <span>{metadataLabels.totalLabel}</span>
          <span className="font-mono">{breakdown.total_credits}</span>
        </li>
      </ul>
    </section>
  );
}

function CallLogSection({ calls }: { calls: ApiCallSummary[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="meta-calls" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="meta-calls" className="text-h3">
          {metadataLabels.callLogHeader}
        </h3>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="meta-calls-table"
          className="text-small text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {open ? metadataLabels.callLogToggle.close : metadataLabels.callLogToggle.open}
        </button>
      </div>

      {calls.length === 0 ? (
        <p className="text-small text-muted-foreground">
          {metadataLabels.callLogEmpty}
        </p>
      ) : open ? (
        <div
          id="meta-calls-table"
          className="overflow-x-auto rounded-lg border border-border"
        >
          <table className="w-full min-w-[640px] text-small">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>{metadataLabels.callLogColumns.occurredAt}</Th>
                <Th>{metadataLabels.callLogColumns.provider}</Th>
                <Th>{metadataLabels.callLogColumns.model}</Th>
                <Th align="right">{metadataLabels.callLogColumns.latency}</Th>
                <Th align="right">{metadataLabels.callLogColumns.cost}</Th>
                <Th>{metadataLabels.callLogColumns.status}</Th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0">
                  <Td className="font-mono">{formatTimestamp(call.occurred_at)}</Td>
                  <Td>{call.provider}</Td>
                  <Td className="font-mono">{call.model}</Td>
                  <Td align="right" className="font-mono">
                    {formatLatency(call.latency_ms)}
                  </Td>
                  <Td align="right" className="font-mono">
                    {call.cost_usd}
                  </Td>
                  <Td>{metadataLabels.callLogStatus[call.status]}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-caption uppercase tracking-wider text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </td>
  );
}

export default MetadataTab;

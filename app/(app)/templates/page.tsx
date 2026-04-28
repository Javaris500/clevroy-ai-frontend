"use client";

// /templates — curated browse-and-use gallery of starting-point film
// templates. Public to all users; the catalogue is owned by the Clevroy
// team (community submissions are post-v1).
//
// Page composition:
//   <PagePanel> header (title + subline, no toolbar — toolbar lives in the
//   filter strip so it can be sticky)
//     <FeaturedRow />            — 2-3 hand-picked templates at lg size
//     <CategoryFilterStrip />    — sticky, holds category chips + search
//     <TemplatesGrid />          — filtered grid; hover-autoplay on cards
//     <TemplateDetailSheet />    — controlled-state side panel
//
// Click on a card opens the detail sheet via local state. "Use this template"
// inside the sheet routes to /home with the script + style + aspect handed
// off through sessionStorage prefill keys (consumed once on mount in
// ChatSurface's EmptyView).

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { PagePanel } from "@/components/shell/PagePanel";
import {
  CategoryFilterStrip,
  FeaturedRow,
  TemplateDetailSheet,
  TemplatesGrid,
} from "@/components/templates";
import { templates as copy } from "@/lib/copy";

export default function TemplatesPage() {
  const params = useSearchParams();
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Hide the featured row when the user is actively filtering — they're
  // looking for something specific, not browsing.
  const isFiltering =
    (params.get("cat") ?? "all") !== "all" || (params.get("q") ?? "").length > 0;

  function handleSheetOpenChange(open: boolean) {
    if (!open) setOpenId(null);
  }

  return (
    <PagePanel title={copy.pageTitle} subline={copy.subline}>
      <div className="space-y-6">
        {!isFiltering ? <FeaturedRow onOpen={setOpenId} /> : null}
        <CategoryFilterStrip />
        <TemplatesGrid onOpen={setOpenId} />
      </div>
      <TemplateDetailSheet
        templateId={openId}
        onOpenChange={handleSheetOpenChange}
      />
    </PagePanel>
  );
}

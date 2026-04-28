"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Paperclip } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ThreadMessage } from "@/stores/chat-store";

/**
 * `user` message renderer (Clevroy_Chat_Surface.md §2.1).
 *
 * Right-aligned bubble, `bg-primary-soft`, `text-foreground`, Inter, 12px
 * radius, max 70% column width. Optionally renders attachment chips beneath
 * the text — `metadata.attachments` is populated when the user submits with
 * files attached; chips show filename + image preview when applicable.
 *
 * Persistence note: attachment URLs are browser blob URLs and don't survive
 * a reload (Layer 5 swaps for R2-signed URLs). We render filename only when
 * the URL is missing or stale.
 */
export interface UserMessageProps {
  message: ThreadMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 4 };
  const attachments = message.metadata?.attachments ?? [];

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="ml-auto flex max-w-[70%] flex-col items-end gap-1.5"
    >
      <div className="rounded-2xl bg-primary-soft px-4 py-3 text-foreground">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
      </div>
      {attachments.length > 0 ? (
        <div className="flex max-w-full flex-wrap justify-end gap-1.5">
          {attachments.map((file, i) => {
            const isImage = file.mediaType?.startsWith("image/") === true;
            const hasUrl = typeof file.url === "string" && file.url.length > 0;
            return (
              <span
                key={`${file.filename}-${i}`}
                className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pl-1 pr-2 text-xs text-foreground"
              >
                {isImage && hasUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt=""
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Paperclip className="size-3" strokeWidth={1.75} />
                  </span>
                )}
                <span className="truncate font-mono text-[11px]">
                  {file.filename}
                </span>
              </span>
            );
          })}
        </div>
      ) : null}
    </motion.div>
  );
}

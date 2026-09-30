"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Polished loading UI for the active snippet inspector.
 * Accurately mirrors the exact dimensions, paddings, and typography rhythm
 * of the live code inspector without fake line numbers.
 */
export function SnippetInspectorSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading snippet content..."
      aria-busy="true"
      className="flex-1 h-full bg-background flex flex-col min-w-0 text-foreground overflow-hidden animate-in fade-in duration-150"
    >
      {/* Top Header Bar Skeleton — Aligned exact h-14 height with Sidebar and Snippet List */}
      <div className="h-14 px-5 border-b border-border flex items-center justify-between gap-4 bg-card/50 backdrop-blur-md shrink-0">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-48 max-w-full rounded-md" />
            <Skeleton className="h-4.5 w-14 rounded-md" />
          </div>
          <Skeleton className="h-3 w-64 max-w-md rounded-md opacity-60" />
        </div>

        {/* Action Button Skeletons: 4 icon buttons + 1 copy button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Skeleton className="h-8.5 w-8.5 rounded-lg" />
          <Skeleton className="h-8.5 w-8.5 rounded-lg" />
          <Skeleton className="h-8.5 w-8.5 rounded-lg" />
          <Skeleton className="h-8.5 w-8.5 rounded-lg" />
          <Skeleton className="h-8.5 w-24 rounded-lg" />
        </div>
      </div>

      {/* Code Display Area Skeleton — Mirrors SnippetInspector pre container exactly */}
      <div className="flex-1 overflow-hidden p-5 font-mono text-xs sm:text-sm">
        <div className="p-4.5 rounded-xl border border-border bg-card/60 space-y-3 shadow-xs">
          {/* Realistic syntax line silhouettes (NO line numbers) */}
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
          <div className="h-1.5" />
          <Skeleton className="h-4 w-96 ml-4 rounded" />
          <Skeleton className="h-4 w-64 ml-4 rounded" />
          <Skeleton className="h-4 w-40 ml-8 rounded" />
          <Skeleton className="h-4 w-80 ml-8 rounded" />
          <Skeleton className="h-4 w-28 ml-4 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-52 ml-4 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>

      {/* Footer Metadata Skeleton */}
      <div className="px-5 py-3 border-t border-border bg-card/40 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-14 rounded" />
        </div>
      </div>
      <span className="sr-only">Loading snippet details...</span>
    </div>
  );
}

/**
 * Skeleton list items for loading snippet cards in the feed.
 * Matches exact card dimensions, left-accent border, and metadata row without numbers.
 */
export function SnippetListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading snippets list..."
      className="p-2 space-y-2 animate-in fade-in duration-150"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl border border-border/70 bg-card/50 space-y-2.5 shadow-2xs"
        >
          {/* Top Row: Type Icon, Title & Copy Placeholder */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-6 w-6 rounded-md shrink-0" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          </div>

          {/* Monospace Code Preview Box with Accent Border */}
          <div className="p-2.5 rounded-lg border border-border/60 border-l-[3px] border-l-muted-foreground/30 bg-background/90 space-y-1.5 mb-2.5">
            <Skeleton className="h-3 w-4/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
          </div>

          {/* Metadata Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-12 rounded" />
              <Skeleton className="h-3.5 w-14 rounded" />
            </div>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading snippet cards...</span>
    </div>
  );
}

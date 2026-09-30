"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

export function ResizeHandle({
  onMouseDown,
  onDoubleClick,
  isDragging = false,
  className,
}: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      title="Drag to resize panel (Double-click to reset)"
      className={cn(
        "relative w-1 h-full select-none cursor-col-resize shrink-0 transition-colors group z-20",
        isDragging ? "bg-primary" : "bg-border hover:bg-primary/60",
        className
      )}
    >
      {/* Expanded invisible hit area for easy grabbing */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />

      {/* Centered subtle grab dot on hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-muted-foreground/30 group-hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

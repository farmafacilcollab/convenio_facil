import * as React from "react"
import { cn } from "@/lib/utils"

function GroupedSection({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="grouped-section"
      className={cn("overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] dark:border dark:border-white/5", className)}
      {...props}
    />
  )
}

function GroupedSectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="grouped-section-header"
      className={cn("px-5 pb-1.5 pt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    />
  )
}

function GroupedSectionItem({
  className,
  isLast = false,
  ...props
}: React.ComponentProps<"div"> & { isLast?: boolean }) {
  return (
    <div
      data-slot="grouped-section-item"
      className={cn(
        "flex min-h-11 items-center px-5 py-3 transition-colors duration-150 active:bg-accent/50",
        !isLast && "border-b border-[var(--grouped-separator)]/30",
        className
      )}
      {...props}
    />
  )
}

export { GroupedSection, GroupedSectionHeader, GroupedSectionItem }

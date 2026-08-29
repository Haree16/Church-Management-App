import * as React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <FolderOpen className="h-10 w-10 text-slate-400" />,
  title,
  description,
  actionLabel,
  onAction,
  actionNode,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center animate-in fade-in-50 dark:border-slate-800",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      <div className="mt-5">
        {actionNode ? (
          actionNode
        ) : actionLabel && onAction ? (
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

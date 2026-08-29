import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  change,
  trend = "neutral",
  icon,
  iconBgColor = "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shadow-sm", iconBgColor)}>
            {icon}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </p>
          {change && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold",
                trend === "up" && "text-emerald-600 dark:text-emerald-400",
                trend === "down" && "text-red-600 dark:text-red-400",
                trend === "neutral" && "text-slate-500"
              )}
            >
              {trend === "up" && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
              {trend === "down" && <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
              {change}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

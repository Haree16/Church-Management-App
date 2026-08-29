import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  date?: string;
  onDateChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  disabled = false,
  className,
}: DatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker?.();
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={handleContainerClick}
        className={cn(
          "w-full justify-start text-left font-normal h-9 px-3",
          !date && "text-slate-500 dark:text-slate-400"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
        {date ? date : <span>{placeholder}</span>}
      </Button>
      <input
        ref={inputRef}
        type="date"
        value={date || ""}
        disabled={disabled}
        onChange={(e) => onDateChange?.(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
      />
    </div>
  );
}

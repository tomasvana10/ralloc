import { CircleQuestionMark } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function SimpleTooltip({
  tip,
  children,
}: React.PropsWithChildren<{ tip: string | React.ReactNode }>) {
  return (
    <>
      {/* desktop */}
      <div className="hidden sm:block">
        <Tooltip>
          <TooltipTrigger asChild tabIndex={0}>
            {children ?? (
              <CircleQuestionMark className="text-foreground size-4" />
            )}
          </TooltipTrigger>
          <TooltipContent className="bg-secondary text-secondary-foreground border border-border text-sm">
            {tip}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* mobile */}
      <div className="inline-flex sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            {children || (
              <CircleQuestionMark className="text-foreground size-4" />
            )}
          </PopoverTrigger>
          <PopoverContent>{tip}</PopoverContent>
        </Popover>
      </div>
    </>
  );
}

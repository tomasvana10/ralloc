import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@web/components/ui/tooltip";
import { focusStyles } from "@web/lib/constants";
import { CircleQuestionMark } from "lucide-react";
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
          <TooltipTrigger asChild tabIndex={0} className={focusStyles}>
            {children ?? (
              <CircleQuestionMark className="text-foreground size-[0.9rem]" />
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
              <CircleQuestionMark className="text-foreground size-[0.9rem]" />
            )}
          </PopoverTrigger>
          <PopoverContent>{tip}</PopoverContent>
        </Popover>
      </div>
    </>
  );
}

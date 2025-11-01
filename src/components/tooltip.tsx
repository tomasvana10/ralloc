import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface Props {
  tip: React.ReactNode;
}

export function SimpleTooltip({ tip }: Props) {
  return (
    <>
      {/* desktop */}
      <div className="hidden sm:block">
        <Tooltip>
          <TooltipTrigger asChild tabIndex={0}>
            <span>
              <CircleQuestionMark className="text-foreground size-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      </div>

      {/* mobile */}
      <div className="inline-flex sm:hidden">
        <Popover>
          <PopoverTrigger tabIndex={0}>
            <span>
              <CircleQuestionMark className="text-foreground size-4" />
            </span>
          </PopoverTrigger>
          <PopoverContent>{tip}</PopoverContent>
        </Popover>
      </div>
    </>
  );
}

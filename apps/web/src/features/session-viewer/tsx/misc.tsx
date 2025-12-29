import { Button } from "@web/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@web/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@web/components/ui/empty";
import { Skeleton } from "@web/components/ui/skeleton";
import { BrushCleaning, EllipsisVertical, MegaphoneIcon } from "lucide-react";

export function SessionSummarySkeleton() {
  return (
    <div className="flex flex-row items-center sm:gap-4 gap-2 min-h-[102px]">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  );
}

export function EmptyCurrentGroup({
  isHost,
  frozen,
}: {
  isHost: boolean;
  frozen: boolean;
}) {
  return (
    <Empty className="border border-dashed p-0! min-h-[90px]">
      <EmptyHeader>
        <EmptyTitle>You Have No Group</EmptyTitle>
        <EmptyDescription className="whitespace-nowrap">
          {isHost ? (
            <span className="inline-flex items-center">
              Access group options through the{" "}
              <EllipsisVertical className="size-4" /> menu.
            </span>
          ) : frozen ? (
            "You can't join a group right now, as the session has been locked by the host."
          ) : (
            "Join one below by clicking on its box."
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function EmptyGroups() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BrushCleaning />
        </EmptyMedia>
        <EmptyTitle>No Matches Found</EmptyTitle>
        <EmptyDescription>Try a different query.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function SessionAdvertisementDialog({
  trigger,
  hostName,
  name,
  code,
}: {
  trigger: React.ReactNode;
  hostName: string;
  name: string;
  code: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_URL;
  const directUrl = `${baseUrl}/s/${code}`;
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogHeader>
        <DialogTitle hidden>Advertise</DialogTitle>
      </DialogHeader>
      <DialogContent className="overflow-scroll p-10 flex items-center justify-center flex-col min-w-[calc(100vw-100px)] min-h-[calc(100vh-100px)]">
        <MegaphoneIcon className="size-40 stroke-[1.5px] my-2" />
        <p className="text-4xl text-muted-foreground font-serif text-center">
          {hostName} is inviting you to join
        </p>
        <h1 className="text-6xl">{name}</h1>
        <div className="border border-border p-6 rounded-sm mt-8 flex items-center justify-center flex-col">
          <p className="text-2xl">
            Head to{" "}
            <Button variant="link" asChild className="text-2xl px-0">
              <a href={baseUrl} target="_blank" rel="noopener noreferrer">
                {baseUrl}
              </a>
            </Button>{" "}
            and join with code
          </p>
          <h2 className="text-9xl font-atkinson tracking-wide font-light bg-card w-fit h-fit my-8 p-6 rounded-sm border border-border">
            {code}
          </h2>
          <p className="text-2xl text-muted-foreground">
            or, join directly by visiting{" "}
            <Button
              variant="link"
              asChild
              className="text-2xl px-0 text-muted-foreground">
              <a href={directUrl} target="_blank" rel="noopener noreferrer">
                {directUrl}
              </a>
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

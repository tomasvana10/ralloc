import { BoxesIcon, ChevronRightIcon, CloudAlert, Trash2 } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import { useGroupSessions } from "@/lib/hooks/groupSessions";
import { Skeleton } from "./ui/skeleton";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import Link from "next/link";
import { Button } from "./ui/button";

interface Props {
  userId: string;
}

export function MySessions({ userId }: Props) {
  const { sessions, isLoading, error, mutate } = useGroupSessions(userId);

  if (isLoading) return <MySessionsSkeleton />;
  if (error) return <MySessionsEmpty cause="error" />;

  return sessions.length === 0 ? (
    <MySessionsEmpty cause="empty" />
  ) : (
    <div className="flex w-full flex-col gap-4">
      {sessions.map(session => (
        <Item asChild variant="outline" key={session.code}>
          <Link href="#">
            <ItemActions>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={async () => {
                  await fetch(`/api/sessions/${session.code}`, {
                    method: "DELETE",
                  });
                  mutate();
                }}>
                <Trash2 />
              </Button>
            </ItemActions>
            <ItemContent>
              <ItemTitle>{session.name}</ItemTitle>
              <ItemDescription>{session.description}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </Link>
        </Item>
      ))}
    </div>
  );
}

export function MySessionsSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
    </div>
  );
}

export function MySessionsEmpty({ cause }: { cause: "error" | "empty" }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {cause === "empty" ? (
            <BoxesIcon />
          ) : (
            <CloudAlert className="stroke-destructive" />
          )}
        </EmptyMedia>
        <EmptyTitle>
          {cause === "empty"
            ? "No Group Sessions Yet"
            : "Couldn't Fetch Group Sessions"}
        </EmptyTitle>
        <EmptyDescription>
          {cause === "empty"
            ? " You haven't created a group session yet. Create one using the form on this page and it will be displayed here."
            : "Try reloading the page."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

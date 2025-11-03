"use client";

import { ChevronRightIcon, Trash2 } from "lucide-react";
import { useGetGroupSessionsSWR } from "@/lib/hooks/swr/group-sessions";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import Link from "next/link";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface Props {
  userId: string;
}

export function MySessions({ userId }: Props) {
  const { data, mutate } = useGetGroupSessionsSWR(userId, {
    onError: err => {
      toast.error(err.message, {
        id: "group-sessions-swr-err",
        description: "Couldn't fetch group sessions. Try reloading the page.",
      });
    },
  });

  return (
    <div className="flex w-full flex-col gap-2">
      {data.map(session => (
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
